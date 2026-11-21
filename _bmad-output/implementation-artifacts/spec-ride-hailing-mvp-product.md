---
title: 'Ride-hailing MVP product implementation'
type: 'feature'
created: '2026-11-21'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '49c1b719ec0e51b76548abfa8196881be4fa17ec'
context:
  - input/Uber_Ride_Hailing_PRD.md
  - input/Ride-Hailing MVP · UX Strategy.md
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/planning-artifacts/architecture/architecture-BMAD-2026-11-21/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/mockups/key-screens.html
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Riders, drivers, and operations staff need one working pilot product to request and complete rides, handle payment and safety outcomes, and operate by service zone. The repository currently contains planning artifacts only.

**Approach:** Build the full MVP across rider and driver mobile apps, an operations console, and a shared backend, covering all six epics and preserving their user stories and acceptance criteria. Use the PRD and UX strategy as product truth and the approved visual direction and key-screen mockup as design guidance.

## Boundaries & Constraints

**Always:** Implement all 35 stories across the six epics. Keep trip lifecycle and payment lifecycle distinct, server authoritative, and safe to retry. Enforce role checks and audit sensitive operations. Protect identity documents, payment data, precise location, and pickup PINs from analytics. Keep location-denied address entry, accessible controls, stale-location messaging, and explicit recovery states. Preserve AD-1–AD-11 domain ownership and transaction rules, resolving architecture gaps before dependent implementation. **Decision:** The first build uses deterministic local/demo adapters for phone verification, maps, payments, and messaging. Keep adapters replaceable; do not send real messages, geocode through live services, or move real money.

**Never:** Add deferred PRD features (scheduled/shared rides, multi-stop, cash, subscriptions, promotions, airport flows, or dynamic pricing). Treat the static mockup as production behavior. Use real customer/payment data or enable production money movement before provider, market, and operational launch decisions are made.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|----------------------------|----------------|
| Successful ride | Eligible driver, supported route, valid quote and payment method | One assigned driver; trip proceeds through pickup verification and completion; fare is captured once | Repeated commands return their prior outcome |
| No supply or driver cancels | Search expires or assigned driver cancels before pickup | Explain outcome and fee state; offer retry or rider-chosen rematch | No duplicate request or charge |
| Connectivity or location failure | Client reconnects or receives stale/out-of-order samples | Restore authoritative trip state; mark location stale with last update | Reject stale mutations and provide a recovery action |
| Payment or safety exception | Capture/payout uncertain, refund requested, or urgent report submitted | Preserve trip state; create durable, auditable work and show its actual status | Reconcile unknown money outcomes before retry; route urgent cases to staffed response |

</frozen-after-approval>

## Code Map

- `input/Uber_Ride_Hailing_PRD.md` — product scope, R01–R11, lifecycle, privacy, accessibility, pilot metrics, and launch gates.
- `input/Ride-Hailing MVP · UX Strategy.md` — user journeys, state behavior, error recovery, and role-specific UX principles.
- `_bmad-output/planning-artifacts/epics.md` — six epics, 35 user stories, and Given/When/Then acceptance criteria; retain these as implementation coverage.
- `_bmad-output/planning-artifacts/architecture/architecture-BMAD-2026-11-21/ARCHITECTURE-SPINE.md` — modular-monolith intent, domain invariants, stack proposal, and service boundaries. Status is draft; close known review findings before relying on unresolved seams.
- `_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/DESIGN.md` and `EXPERIENCE.md` — design tokens, accessibility floor, state patterns, and complete key flows.
- `_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/mockups/key-screens.html` — visual and interaction reference for pickup, quote refresh, money recovery, emergency calling, and refund confirmation.
- `_bmad-output/implementation-artifacts/spec-1-1-submit-driver-documents.md` — earlier story plan; preserve its configurable checklist and secure-document constraints, but reconcile its stack-open assumption with the architecture spine.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — story tracker currently says backlog for Story 1.1 despite its separate spec being in-progress; reconcile before using it for progress reporting.
- `README.md` — confirms there is no app implementation. Repository inspection found no application source, dependency manifests, migrations, test suite, or deployment configuration. BMAD tooling and the HTML mockup are not product code.
- No app code exists to extend. The new implementation will need to establish the repository layout, client and server scaffolds, persistence, configuration, and local run path.

## Tasks & Acceptance

**Execution:**
- [x] Resolve the selected integration mode and close architecture review gaps affecting availability ownership, transaction seams, location ordering, payments/payouts, identity, and operational recovery.
- [x] Scaffold the rider app, driver app, operations console, shared API contract, modular backend, database, worker, and local developer setup.
- [ ] Implement Epic 1 eligibility and document review, then Epic 2 sign-in, supported locations, quotes, booking, dispatch, and retry behavior.
- [ ] Implement Epic 3 pickup, location freshness, PIN verification, cancellation/no-show, rematch, and completion flows.
- [ ] Implement Epic 4 fare, payment recovery, earnings, payout, refund, and reconciliation flows with durable idempotency.
- [ ] Implement Epic 5 sharing, emergency entry, feedback, support cases, urgent escalation, and audited operations resolution.
- [ ] Implement Epic 6 deduplicated pilot events, zone/hour reporting, operational alerts, booking pause, and expansion review.
- [ ] Apply UX tokens and interaction rules to all surfaces; document local startup and configuration in the project README.

**Acceptance Criteria:**
- Given an invited rider, an approved driver, and a supported route, when the rider books, then the system creates at most one request, assigns at most one eligible driver, and shows authoritative trip state on reconnect.
- Given any trip or payment failure covered by the epics, when the user or operator takes the specified recovery action, then the state, fees, next step, and audit record match the story acceptance criteria.
- Given sensitive documents, precise location, payment data, or PINs, when the product stores or reports activity, then access is authorized and analytics excludes the sensitive values.
- Given a zone is paused, when new booking is attempted, then it is blocked while active trips can finish and remain recoverable.
- Given the completed build, when a developer follows the documented local setup, then rider, driver, operations, backend, and worker surfaces can be exercised together against the configured integration mode.

## Implementation Notes

The repository now has rider and driver Expo apps, an operations console, a NestJS API and worker, PostgreSQL migrations, shared contracts, local provider adapters, encrypted local document storage, and a README startup path. Follow-up work added idempotent booking and offer actions, current-document eligibility checks, payment authorization before dispatch, payment capture/release/refund work, pending payout records, case idempotency, and trip-state polling. The latest pass also disables demo authentication in production, serializes driver availability changes, validates encrypted document uploads, routes operations document reads through the audited decrypt path, hides offers from busy drivers, restricts incident and support access to trip participants, bounds worker retries, adds audited idempotent case resolution, and reports zone metrics with hourly rate denominators and zero-sample hours. The complete six-epic implementation remains incomplete: important acceptance paths are partial, the edge-case matrix does not yet have passing end-to-end coverage, and the apps and database have not been exercised together.

## Design Notes

Implementation order follows the dependency chain: eligibility → booking/dispatch → trip lifecycle → money and safety → pilot operations. Keep external providers behind owned interfaces so local development and launch configuration do not fork domain behavior.

## Verification

**Manual checks:**
- Walk the end-to-end rider/driver journey, reconnect recovery, denied-location path, stale GPS, rematch, failed payment, refund, payout investigation, safety escalation, and zone pause using the epic acceptance criteria.
- Inspect screen-reader labels, large text, focus behavior, touch targets, and sensitive analytics payloads against DESIGN.md and EXPERIENCE.md.
- Confirm README setup instructions bring up the configured clients and backend locally.

**Commands:**
- `npm --workspace apps/api test` — passed: 9 local-adapter, trip-rule, and driver-eligibility tests.
- `npm run typecheck` — passed for API, operations console, rider, and driver workspaces.
- `npm run build` — passed for API and operations console.
- `npx expo export --platform web` — passed for both rider and driver apps.
- `npm --workspace apps/api test` — passed: 9 local-adapter, trip-rule, and driver-eligibility tests.
- `git diff --check HEAD` — passed for the current worktree changes.
- Database-backed integration/E2E checks remain unverified: Docker API access is denied in this environment, and the service flows have not been exercised against PostgreSQL.
