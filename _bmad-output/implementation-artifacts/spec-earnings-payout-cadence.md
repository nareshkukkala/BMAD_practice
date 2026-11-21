---
title: 'Automatic payout cadence for driver earnings'
type: 'feature'
created: '2026-11-21'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
context: []
baseline_commit: 'bafc5a6d2bff1de727a662b05674d9a88cb1387c'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 4's payout story (`epics.md` 4.4, FR8) is only half-built. The backend already models `earning`/`payout` entities and a `payout()` action that correctly creates an idempotent payout work item (`apps/api/src/service.ts`), and `apps/api/src/worker.ts` already fully processes that work item (marks earnings `paid`/`available` on success/failure). But nothing ever triggers a payout automatically — `payout-run` is an ops-only manual action, so in practice a driver's earnings never get paid out unless an ops agent remembers to call it.

**Approach:** Add an automatic payout cadence to `apps/api/src/worker.ts`: on each loop iteration (alongside the existing `expireSearches()` check), find drivers with `available` earnings older than a configurable `PAYOUT_CADENCE_SECONDS`, and create the same idempotent payout work item the manual `payout-run` action creates today — reusing the existing SQL pattern directly in `worker.ts` (which already doesn't import the API's `Marketplace` class for any of its other checks; duplicating this one small insert keeps the change isolated and doesn't risk the existing manual path). The driver-facing earnings/payout UI readability improvement is a separate, independently-useful piece tracked in `deferred-work.md`.

## Boundaries & Constraints

**Always:**
- Reuse the existing idempotent work-item pattern exactly: `operation_key = payout:{driverId}:{sorted earning ids joined by ,}` via `ON CONFLICT(operation_key) DO UPDATE` (mirrors `apps/api/src/service.ts`'s `payout()`), so an automatic cadence run and a manual `payout-run` for the same driver/earnings never double-create or double-pay.
- Mark earnings `payout_pending` in the same transaction the work item is created, exactly as the existing manual path does.
- Make the cadence threshold configurable via an env var (`PAYOUT_CADENCE_SECONDS`), following the existing naming convention (`QUOTE_TTL_SECONDS`, `DISPATCH_TIMEOUT_SECONDS`, `NO_SHOW_GRACE_SECONDS`).

**Never:**
- Do not modify `apps/rider`, `apps/driver`, `apps/console`, `packages/contracts`, the `entities`/`work_items` table schemas, or the existing `payout-run`/manual ops-triggered path — it must keep working unchanged alongside the new automatic cadence.
- Do not add new npm dependencies.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Available earnings age past the cadence threshold | `earning.status='available'` and `created_at <= now() - PAYOUT_CADENCE_SECONDS` | The worker automatically creates a payout work item for that driver on its next loop iteration, exactly as if `payout-run` had been called for them | If the driver has zero available earnings, no work item is created (matches the existing manual path's "No eligible earnings" behavior) |
| Available earnings have not yet aged past the threshold | `earning.status='available'` and `created_at > now() - PAYOUT_CADENCE_SECONDS` | No payout work item is created for that earning yet | n/a |
| The cadence check runs twice for the same driver before the payout settles | Same driver, same set of available earnings, cadence check fires again before the prior work item resolves | The idempotent `operation_key` ensures only one work item exists; the second cadence pass is a no-op (`ON CONFLICT DO UPDATE` on the same key, not a new payout) | n/a |
| A driver earns a new completed-trip payment after their existing earnings were already marked `payout_pending` | Mixed `available` and `payout_pending` earnings for one driver | Only the `available` ones are included in a new payout run; the `payout_pending` ones are left alone until their own work item settles | n/a |

</frozen-after-approval>

## Code Map

- `apps/api/src/worker.ts` `main()` loop (`for (;;) { await expireSearches(); if (!(await processOne())) await sleep(1500); }`) -- add a new `runPayoutCadence()` function called alongside `expireSearches()` each iteration.
- `apps/api/src/service.ts` `payout()` (the private method backing the `payout-run` command, around the `'No eligible earnings'`/`work_items` INSERT with `ON CONFLICT(operation_key) DO UPDATE`) -- reference only, do not modify. Its SQL pattern (`SELECT ... FROM entities WHERE kind='earning' AND owner_id=$1 AND status='available' ... FOR UPDATE`, then build `operation_key=payout:{driverId}:{ids.join(',')}`, `INSERT INTO work_items(...) ON CONFLICT(operation_key) DO UPDATE ...`, then `UPDATE entities SET status='payout_pending' WHERE kind='earning' AND id=ANY($1::text[]) AND status='available'`) is exactly what `runPayoutCadence()` should replicate per-driver, substituting a `created_at` age filter (`created_at <= now() - PAYOUT_CADENCE_SECONDS`) for the manual trigger's "all available earnings regardless of age."
- `apps/api/src/worker.ts` `processOne()`'s existing `work.kind === 'payout'` branches (success: mark earnings `paid`, upsert a `paid` payout entity; failure: mark earnings back to `available`, upsert a `failed` payout entity) -- reference only, unchanged; this already fully processes whatever work item `runPayoutCadence()` creates.
- `.env.example` -- add `PAYOUT_CADENCE_SECONDS` alongside the other `_SECONDS` config vars.

## Tasks & Acceptance

**Execution:**
- [x] `apps/api/src/worker.ts` -- add `runPayoutCadence()` (group `available`, cadence-eligible earnings per driver via `owner_id`, then for each driver create the idempotent payout work item + `payout_pending` update, mirroring `payout()`'s SQL) and call it from `main()`'s loop -- closes FR8/story 4.4's automatic-cadence requirement
- [x] `.env.example` -- add `PAYOUT_CADENCE_SECONDS` with a sensible default

**Acceptance Criteria:**
- Given a driver has `available` earnings older than `PAYOUT_CADENCE_SECONDS`, when the worker's next loop iteration runs, then a payout work item is created and those earnings move to `payout_pending` without any manual action.
- Given the cadence check runs again before that payout settles, when it re-evaluates the same driver, then no duplicate work item or payout entity is created (same `operation_key`).
- Given available earnings have not yet aged past the threshold, when the cadence check runs, then they are left untouched.
- Given the manual `payout-run` ops action is called for a driver whose earnings were already picked up by the automatic cadence (now `payout_pending`), then it correctly reports "No eligible earnings" rather than creating a second payout — this is existing, unmodified behavior, verified to still hold.

## Implementation Notes

**Reviewer live verification (2026-11-21).** The implementing subagent already did a thorough live DB + real-worker test (documented in its report) and cleaned up afterward. Independently re-verified myself against the running stack (temporarily set `PAYOUT_CADENCE_SECONDS=15` in `.env`, restarted the worker process to pick it up):
- Inserted a synthetic `earning` row 30s old for a throwaway driver id and confirmed within 5s it automatically progressed `available` → `paid`, with a correctly-formed `work_items` row (`operation_key='payout:driver-cadence-verify:earning:cadence-verify-1'`) and a `payout` entity created at `status='paid'` — all without calling `payout-run`.
- Inserted a second, freshly-created (0s old) `earning` row for a different throwaway driver and confirmed it was correctly left `available` (not swept up prematurely).
- Cleaned up both test drivers' rows, restored `PAYOUT_CADENCE_SECONDS=86400` in `.env`, and restarted the worker so the dev environment is back to normal.

**Patch round 1 (reviewer, 2026-11-21).** Three independent review layers raised 14 findings; triaged to 9 refuted (verified against the schema and the existing manual `payout()` path — most objections matched pre-existing codebase conventions, e.g. the already-present `UNIQUE` constraint on `work_items.operation_key` and the already-present `entities(kind,status)` index), 3 deferred (a stuck-failed-payout retry gap confirmed pre-existing in the manual path, and the test-coverage gap), and 2 routed as patches. Sent those 2 back to the implementer subagent; it fixed both in `apps/api/src/worker.ts` only. Re-ran `npm run typecheck`/`build`/`test` across the whole workspace myself — all pass. Live-verified both fixes against the running stack:
- NaN safety: set `PAYOUT_CADENCE_SECONDS=not-a-number`, restarted the worker, confirmed no `worker loop failed` errors appeared (previously this would have thrown on every iteration), then booked and confirmed a real trip's payment still authorized normally — proving `processOne()` was no longer being blocked.
- Payout-entity visibility: set a short cadence again, inserted an aged test earning, and confirmed a `payout` entity now exists (created atomically in the same transaction as the work item, so the two can never be observed out of sync). Cleaned up and restored `.env`/the worker to normal afterward.

## Review Triage Log

Reviewed by blind-hunter, edge-case-hunter and verification-gap against the diff since `baseline_commit`.

| Claim | Verdict | Evidence | Route |
|---|---|---|---|
| `runPayoutCadence()` runs on every worker loop tick (~1.5s when idle) instead of being paced to `PAYOUT_CADENCE_SECONDS` (blind-hunter) | false | Intended design, not a bug: checking frequently means eligible earnings are picked up promptly after crossing the age threshold rather than with extra added delay. Matches the sibling `expireSearches()` function's identical "run every tick" pattern in the same file. | reject |
| The driver query's `LIMIT 100` has no `ORDER BY`/paging, risking starvation if more than 100 drivers are eligible in one cycle (blind-hunter, edge-case-hunter) | false | Matches `expireSearches()`'s identical `LIMIT 100` pattern with no fairness ordering. Unrealistic at this pilot's explicitly one-city, one-zone scope (PRD). | reject |
| `Number(e.data.netMinor \|\| 0)` silently coerces missing/corrupt earnings data to 0, risking an under-paid driver (blind-hunter) | false | Unreachable given current data flow: earnings are only ever created from `data.finalMinor`, which is always a number (set from the quote's `totalMinor`). Identical to the existing, already-approved manual `payout()`'s own handling of the same field. | reject |
| Currency is taken from the global `PILOT_CURRENCY` env var rather than each earning's own currency field (blind-hunter) | false | Identical to the existing manual `payout()`, which uses the same module-level `currency` constant — not a deviation, and fixing it would require touching `service.ts`, which this spec's frozen boundary forbids. | reject |
| `ON CONFLICT(operation_key)` assumes a unique constraint exists with no migration included to add one (blind-hunter) | false | Refuted: `apps/api/src/migrations/001-initial.sql` already defines `operation_key text NOT NULL UNIQUE` on `work_items`. | reject |
| No success-path logging, only `console.error` on failure (blind-hunter) | false | Matches the existing codebase convention throughout `worker.ts` — neither `expireSearches()` nor `processOne()` log on success either. | reject |
| No index supports the new `entities(kind, status, created_at)` scan pattern (blind-hunter) | false | `entities_kind_status ON entities(kind,status)` already exists and covers the primary filter; the additional `created_at` comparison is a cheap post-filter on an already-narrow result. Negligible at this pilot's explicit scale. | reject |
| The `86400` default is duplicated between `.env.example` and the `worker.ts` fallback and could drift (blind-hunter) | low | True but no clean trivial fix exists without introducing shared config infrastructure; low real-world impact since a real deployment would set the env var explicitly. | reject |
| `client.release()` on the catch path should be `client.release(error)` in case `ROLLBACK` itself throws, to avoid returning a broken connection to the pool (edge-case-hunter) | false | Matches the identical pattern already used by the pre-existing `processOne()` in the same file — not introduced by this diff. | reject |
| Once a payout work item resolves to `failed`, the earnings reset to `available` but the next cadence pass recomputes the identical `operation_key`, hits the existing `failed` row via `ON CONFLICT`, and never retries — appears permanently stuck (blind-hunter, edge-case-hunter, verification-gap) | medium | Confirmed real, but confirmed by verification-gap to be the exact same `operation_key`-dedup/no-retry pattern already present in the existing manual `Marketplace.payout()` — not introduced by this diff, just now triggered automatically instead of only on an explicit ops action. This spec's frozen boundary forbids modifying the manual `payout-run` path, which any holistic fix would need to touch. | defer |
| A malformed `PAYOUT_CADENCE_SECONDS` (non-numeric) becomes `NaN`, which the Postgres interval multiplication rejects, throwing on every single loop iteration — blocking not just payouts but `processOne()`'s entire downstream processing (payments, captures, releases) for the rest of that cycle (edge-case-hunter, blind-hunter) | high | Confirmed real and demonstrable: the outer query runs outside any local try/catch, so the thrown error propagates to `main()`'s loop handler, which catches it but skips `processOne()` for that iteration — repeating indefinitely if the misconfiguration persists. A zero/negative value similarly has no guard. | patch |
| `runPayoutCadence()` never inserts the `entities` row of `kind='payout'` that `GET /api/payout` reads — the manual `payout()` it mirrors inserts that row synchronously in the same transaction, so between work-item creation and `processOne()` processing it, a driver's earnings can show `payout_pending` while `/api/payout` returns nothing for it (verification-gap) | medium | Confirmed real and caused by this diff: the Code Map's SQL-pattern description stopped short of including this step. Fix is a small, bounded addition (the same `INSERT INTO entities(...,'payout',...) ON CONFLICT(id) DO NOTHING` already used in `payout()`), not a reason to revert and re-plan. | patch |
| No automated test exercises `runPayoutCadence()`'s gating/aggregation logic (blind-hunter, verification-gap with a concrete DB-backed test proposal) | medium | Confirmed: no test in the repo touches `worker.ts`, `service.ts`, or the `entities`/`work_items` tables — the existing suite is pure-function unit tests only. Standing up DB-backed integration tests is a new kind of test infrastructure for this repo, not a trivial patch. | defer |



**Commands:**
- `npm run typecheck` -- expected: all four workspaces pass with no errors
- `npm run build` -- expected: api tsc and console vite build succeed
- `npm test` -- expected: existing 9 API tests still pass

**Manual checks (if no CLI):**
- Set `PAYOUT_CADENCE_SECONDS` to a short value (e.g. 30) in `.env`, complete a trip so an `earning` entity exists, wait past the threshold, and confirm (via `GET /api/payout` or the `work_items` table) that a payout was created automatically without calling `payout-run`.
- Immediately call the manual `payout-run` action for the same driver afterward and confirm it reports no eligible earnings (since the cadence already picked them up).
