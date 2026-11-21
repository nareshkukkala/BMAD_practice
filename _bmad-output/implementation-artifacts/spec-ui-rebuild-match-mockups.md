---
title: 'Rebuild rider and driver app UI to match the key-screens mockup'
type: 'feature'
created: '2026-11-21'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
context: []
baseline_commit: '949bafe77e74c10d85178f921673c649f6675ff8'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The rider and driver apps already call the right API actions, but their screens are plain, unordered stacks of buttons/text that don't match the approved mockup (`_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/mockups/key-screens.html`) or the UX strategy's "legible offer, one primary action, failure is a designed state" principles.

**Approach:** Restyle and restructure the existing screens in `apps/rider/App.tsx` and `apps/driver/App.tsx` to match four of the mockup's screens, reusing the color tokens already present (rider: `#edf2f1`/`#17252b`/`#005b55`; driver "night" theme: `#142428`/`#96e6d4`/`#1d3236`) and the existing API calls — no new backend endpoints, no data model changes. The ops console UI pass is deferred separately (see `deferred-work.md`).

## Boundaries & Constraints

**Always:**
- Keep every existing `call('/api/...')` usage as-is; only change markup/structure/styling and client-side state around them.
- Keep accessibility already present (accessibilityLabel/accessibilityRole/accessibilityLiveRegion) and extend it to new structures (e.g. keypad buttons need accessible labels).
- Match the mockup's typography treatment for plate/PIN (large, tabular-nums, letter-spacing) and its 3-column dial-pad layout for PIN entry.
- Preserve all current behavior/guard logic (idempotency keys, version checks, role checks, polling intervals) exactly — this is a UI-only pass.

**Never:**
- Do not add a real map, live GPS loop, payout cadence, or new backend routes — out of scope (tracked in `deferred-work.md`).
- Do not touch `apps/console`, `packages/contracts`, or `apps/api`.
- Do not add new npm dependencies or a component framework; keep the existing single-file-per-app structure with `StyleSheet.create`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Rider reviews a quote | Pickup/destination filled, quote returned | Editable pickup input + a quick alternate-pickup button (mirrors mockup's "Use south entrance pin"), fare breakdown, expiry copy, one primary "Confirm ₹X" action | Expired quote on confirm re-quotes and shows the new total, per existing `book()` handling |
| Rider trip assigned | `trip.status==='Assigned'` or `'Driver arrived'` | "Identify the car" layout: driver name placeholder, large plate, large spaced PIN, Contact/Share/Report/Emergency action row | n/a |
| Rider booking/payment edge states | `paymentStatus` in Authorising/Failed/Pending, or `status==='No driver found'` | Each state shows mockup-equivalent copy + exactly one primary action (Resolve payment / Check status / Try again) | Matches existing `authorizationFailure`/`paymentStatus` branches already in the component |
| Driver verifies pickup | `trip.status==='Driver arrived'` | Dial-pad keypad (1-9, 0, Delete, Clear) feeding a 4-digit PIN display, "Verify and start trip" primary action | Wrong PIN keeps existing error message from `action('start',{pin})` |

</frozen-after-approval>

## Code Map

- `apps/rider/App.tsx` -- single-file rider app; `s` StyleSheet at bottom holds all styles; booking/trip rendering is one large JSX expression keyed off `trip?.status`. Reuse the existing `Button` helper and `call`/`run`/`action` functions; add a plate/PIN display block and restructure the pre-quote card.
- `apps/driver/App.tsx` -- single-file driver app; PIN is currently a raw `TextInput` with `keyboardType="number-pad"` inside the `trip.status==='Driver arrived'` branch. Replace with a dial-pad grid of pressable digit cells appending to the existing `pin` state, matching the mockup's `.pad`/`.key` 3-column grid (Delete/Clear included); keep `action('start',{pin})` call unchanged.
- `_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/mockups/key-screens.html` -- reference only, read for exact copy/structure/CSS values (`.id{font-size:2rem;...letter-spacing:.05em}`, `.pad{grid-template-columns:repeat(3,1fr)}`, `.key{min-height:3.5rem}`); do not modify.

## Tasks & Acceptance

**Execution:**
- [x] `apps/rider/App.tsx` -- rebuild the pre-quote/quote card to match "Review pickup and price" (editable pickup input + quick alternate-pin button + fare/expiry copy, single primary Confirm action) -- matches mockup screen 4 and FR2/FR16
- [x] `apps/rider/App.tsx` -- rebuild the Assigned/Driver-arrived card to match "Identify the car" (large plate + spaced PIN + Contact/Share/Report/Emergency row) -- matches mockup screen 1 and FR5/FR9
- [x] `apps/rider/App.tsx` -- align the existing payment/no-driver-found branches' copy and single-primary-action layout with the "Booking and payment outcomes" scenarios -- matches mockup screen 6 and NFR1
- [x] `apps/driver/App.tsx` -- replace the PIN `TextInput` with a dial-pad keypad component (local component or inline map over digits) -- matches mockup screen 2 and FR5

**Acceptance Criteria:**
- Given the rider has an active quote, when they view the booking screen, then they see an editable pickup field, a way to pick an alternate pickup point, and a single primary "Confirm ₹X" action, matching the mockup's structure.
- Given a trip is Assigned or Driver arrived, when the rider views it, then the plate and PIN render in large, spaced, tabular-numeral styling with Contact/Share/Report/Call-emergency actions visible.
- Given the driver's trip is Driver arrived, when they tap digits on the keypad, then the PIN display updates and Delete/Clear work as expected, with "Verify and start trip" calling the existing `action('start',{pin})`.
- Given any rider payment/no-driver edge state, when it renders, then exactly one primary action is shown (no competing equal-weight buttons), matching UX principle 4.

## Implementation Notes

Implemented 2026-11-21. `apps/rider/App.tsx`: pre-quote card now toggles between a plain booking form and a "Review quote" layout (pickup input + "Use south entrance pin" quick-set button + fare breakdown + expiry copy + single primary Confirm); the Assigned/Driver-arrived branch gained a driver-name/plate detail block and a bordered PIN panel (`idText` style: `fontSize:32`, `letterSpacing:3`, `fontVariant:['tabular-nums']`) plus a Contact-primary/Share-Report-Emergency row; the Completed branch's payment recovery buttons (`Resolve payment`, `Check payment status`) were promoted to `primary` and moved ahead of the secondary utility buttons so each edge state shows exactly one primary action. `apps/driver/App.tsx`: the raw PIN `TextInput` was replaced with an inline `Keypad` (digits 1-9, 0, Delete, Clear) using a `flexWrap` 3-column grid (`key` style `width:'31%'`) feeding the existing `pin` state and a PIN display panel; `action('start',{pin})` is unchanged. No `call('/api/...')` call sites were added, removed, or renamed in either file (verified by diffing the full set of endpoint strings against the pre-change file). `apps/console`, `apps/api`, and `packages/contracts` were not touched.

**Matrix Test Audit (reviewer, 2026-11-21).** The implementing subagent only ran `typecheck`/`build`/`test`, none of which exercise this UI, so none of the four I/O matrix rows had a passing covering test. Closed the gap by live-driving the running dev stack (rider on :8082 as Mira, driver on :8083 as Ravi, against the local Postgres) instead of writing automated UI tests (no RN testing harness exists in this repo and the spec's own Verification section allows manual checks in lieu of CLI):
- Row 1 (rider reviews a quote) — confirmed live: pickup input, "Use south entrance pin" button (verified it actually updates the pickup field/status line), fare breakdown, expiry, single primary Confirm.
- Row 2 (rider trip assigned) — confirmed live: "Pickup in about 4 min" heading, Driver/Vehicle-plate detail rows, spaced large PIN panel, Contact-driver primary + Share/Report/Call row. Screenshot matches the mockup's "Identify the car" figure closely.
- Row 4 (driver verifies pickup) — confirmed live end-to-end: tapped the keypad to enter the rider's actual PIN (3218), the display updated digit-by-digit, "Verify and start trip" transitioned the trip from Driver arrived → In progress via the existing `action('start',{pin})` call.
- Row 3 (payment/no-driver edge states) — only verified by code review, not a live trigger: the demo payment provider always returns `paid` outcome (`DEMO_PROVIDER_OUTCOME`), so forcing a live Failed/Pending render would require restarting the worker with a different env var. Re-read the diff instead: `paymentAction` is the only `primary` button in the Completed branch and is null when payment is `Paid`, so exactly one primary renders in both the Failed and Pending cases. The "No driver found" → "Try again" primary was unchanged from the prior implementation.

**Patch round 1 (reviewer, 2026-11-21).** Sent the 4 patch-routed findings from the Review Triage Log back to the implementing subagent; it fixed all four, confined to the same two files. Re-ran `npm run typecheck`, `npm run build`, `npm test` myself (not just the subagent's narrower per-file check) — all pass. Rewrote the diff and live-verified each fix against the running stack:
- Heading fix: booked a fresh Mira→Ravi trip end-to-end; confirmed "Pickup in about 4 min" at `Assigned`, then "Your driver has arrived" at `Driver arrived` after Ravi marked arrival — resolves the Row 2 imprecision edge-case-hunter flagged, since both sub-states were now separately observed.
- "Change destination": confirmed it returns from the quote-review view to the full booking form (destination/note/history/Review-quote all reappear).
- Keypad disabled state: entered a 4-digit PIN on the driver keypad and confirmed digits 1-9/0 visibly dim (40% opacity) while Delete/Clear stay fully visible and tappable.
- Redundant status line: confirmed removed from the booking-form screenshot.

## Review Triage Log

Reviewed by blind-hunter, edge-case-hunter and verification-gap against the diff since `baseline_commit`. Findings deduplicated by shared root cause; one row per distinct claim.

| Claim | Verdict | Evidence | Route |
|---|---|---|---|
| Rider heading shows "Pickup in about N min" for both `Assigned` and `Driver arrived`, implying there's still an ETA after the driver has arrived (blind-hunter, edge-case-hunter, verification-gap) | medium | Confirmed in code: `isIdentifyCar?` branch covers both statuses with identical heading text; once arrived, telling the rider there's still a pickup ETA is stale/misleading. | patch |
| `trip.etaMinutes` may be undefined, rendering "Pickup in about undefined min" (blind-hunter, edge-case-hunter) | false | Refuted: `apps/api/src/service.ts` `book()` sets `etaMinutes:q.etaMinutes` on every trip from the quote at creation time (`resolveDemoRoute` always returns `etaMinutes:4`); no code path creates a trip without it. | reject |
| Pickup stays editable (incl. new "Use south entrance pin" button) after a quote exists with no fare/eta refresh, so displayed pickup can diverge from what's actually quoted/booked (blind-hunter, edge-case-hunter, verification-gap) | low | Verified display-only and pre-existing in part: the original pre-diff code also rendered the pickup `TextInput` unconditionally alongside an existing quote with no refresh. `book()` only sends `quoteId`/`idempotencyKey` (verification-gap), so the server-side booking itself is unaffected. The mockup itself (`key-screens.html` screen 4) has the identical interaction — a pickup input + quick-set button with no live re-quote — so this is inherited from the approved reference design, not introduced by this diff. | defer |
| "Call emergency services" moved into a secondary 3-up row while "Contact driver" became `primary`, de-emphasizing a safety action relative to a non-urgent one (blind-hunter) | medium | Confirmed real (verified by reading the diff), but confirmed to be an exact match of the approved mockup's own structure (`<div class="action primary">Contact driver</div><hr><div class="row">...<button class="emergency">Call emergency services</button></div>`) — this hierarchy was already decided in the approved UX design artifact, not introduced by this implementation. | defer |
| `trip.pin` could be a non-string value, crashing `.split('')` (edge-case-hunter) | false | Refuted: every write site in `apps/api/src/service.ts` sets `pin:String(randomInt(1000,10000))` or `undefined`; the rider code already guards the undefined case with `(trip.pin||'••••')` before calling `.split()`. | reject |
| Keypad gives no feedback once the PIN reaches 4 digits — `pressKey` silently no-ops but keys look fully enabled (blind-hunter) | low | Confirmed: no `disabled`/`accessibilityState` on digit keys when `pin.length>=4`. Fix is a trivial derived-boolean style change. | patch |
| Replacing the PIN `TextInput` with a keypad removes OS paste/dictation support (blind-hunter, edge-case-hunter) | false | Explicitly directed by this spec's frozen Task 4 ("replace the PIN `TextInput` with a dial-pad keypad component") and the mockup itself has no text-entry fallback either — intent explicitly excludes a paste path. | reject |
| Keypad key order (`1-9, Delete, 0, Clear`) is non-standard, risking mis-taps (blind-hunter) | false | Refuted: exact match to the mockup's own key order (`key-screens.html` `.pad` block lists keys in the identical sequence). | reject |
| New `<Text>Pickup: {pickup}</Text>` line duplicates the adjacent `TextInput`'s own value with no distinguishing information (blind-hunter) | low | Confirmed: both bind to the same `pickup` state and update together. Fix is a one-line deletion. | patch |
| Driver name (`\|\|'Ravi'`) / plate (`\|\|'AB 1234'`) silent fallbacks have no empty/error state if `trip.driver` is missing (blind-hunter) | low | Confirmed pre-existing: identical fallback literals were already present in the pre-diff code; this diff only relocated them into the new detail-row/panel layout. | defer |
| Once a quote exists, destination/pickup-note/trip-history/"Review quote" controls become unreachable with no way back except completing or abandoning the booking — previously they stayed visible alongside an existing quote (edge-case-hunter, high confidence) | medium | Confirmed caused by this diff: the pre-diff code rendered those controls unconditionally even with a quote present; the new `{!quote?...:...}` ternary hides them entirely once quoted, with no "change destination"/"start over" affordance added. | patch |
| My own Implementation Notes claimed the "rider trip assigned" matrix row was "confirmed live" without separately clicking through the `Driver arrived` sub-state (edge-case-hunter, low confidence) | low | Fair: I verified the `Assigned` state live; the `Driver arrived` heading uses the identical code path so the observation generalizes, but I hadn't separately screenshotted it. Resolved by re-verifying live after the heading patch below. | patch |



Keep styling inline/StyleSheet-based in both RN apps (no new dependencies). Reuse the exact token values already defined: rider (`page:#edf2f1`, text `#17252b`, primary `#005b55`) and driver "night" theme (`page:#142428`, card `#1d3236`, primary/accent `#96e6d4`, text `#f2f8f6`). Pull typography/layout numbers directly from the mockup's `<style>` block rather than inventing new values, e.g.:
```
.id { font-size: 2rem; font-variant-numeric: tabular-nums; letter-spacing: .05em }
.pad { display:grid; grid-template-columns:repeat(3,1fr); gap:.4rem }
.key { min-height:3.5rem }
```

## Verification

**Commands:**
- `npm run typecheck` -- expected: all four workspaces pass with no errors
- `npm run build` -- expected: api tsc and console vite build succeed (rider/driver have no build script; typecheck is their gate)
- `npm test` -- expected: existing 9 API tests still pass (UI-only change, should be unaffected)

**Manual checks (if no CLI):**
- Open the rider app at `http://localhost:8082`, sign in as Mira, book a ride, get assigned, and visually compare the quote screen and the assigned-trip screen against the mockup's corresponding figures.
- Open the driver app at `http://localhost:8083`, sign in as Ravi, accept an offer, mark arrival, and verify the keypad enters/clears/deletes digits and submits the correct PIN to `/api/driver/trip-action`.
