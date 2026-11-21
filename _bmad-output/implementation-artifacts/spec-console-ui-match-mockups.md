---
title: 'Add a refund confirmation dialog and a structured documents panel to the ops console'
type: 'feature'
created: '2026-11-21'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
context: []
baseline_commit: '1dd8f280b4362c0a86e6da4bc499144cda488551'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The ops console submits a refund directly from its "Refund preview" form with no confirmation step — unlike the approved mockup (`_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/mockups/key-screens.html`, "Operations · Review a refund"), which gates an eligible refund behind a `<dialog>` that restates the trip/amount/reason and requires an explicit Confirm. Separately, "View documents" dumps raw JSON via `alert(JSON.stringify(...))` instead of a readable panel.

**Approach:** Add a native `<dialog>` confirmation step between the existing refund form and the existing `/api/operations/refund` call (same fields, same request), matching the mockup's dialog markup/CSS and its keyboard focus trap. Replace the `alert()`-based document viewer with a second `<dialog>` rendering the decrypted document values as a `dl/dt/dd` list. No new API calls, no new fields — purely a client-side confirmation/presentation layer in front of calls that already exist.

## Boundaries & Constraints

**Always:**
- Keep the exact same `api('/api/operations/refund', ...)` and `api('/api/operations/document-read', ...)` request shapes; only add a confirmation/presentation step around them.
- Reuse the console's existing render-via-`innerHTML` architecture — the dialogs are part of the template string `render()`/`load()` already produce, not a separate index.html change.
- Implement the mockup's exact focus-trap behavior for both dialogs: `autofocus` on the Cancel button, Tab/Shift+Tab cycling only within the dialog's buttons, `dialog.onclose` returns focus to the button that opened it.
- Preserve the existing `showError` error-surfacing pattern for both flows.

**Never:**
- Do not add a lookup/preview API call to compute "eligible refund amount" — the ops agent still types trip ID, amount, and reason into the existing inputs; the dialog only echoes them back for confirmation before submitting.
- Do not touch `apps/rider`, `apps/driver`, `packages/contracts`, or `apps/api`.
- Do not add new npm dependencies.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ops submits a refund | Trip ID, amount (minor units), reason filled in the existing inputs | Clicking "Submit eligible refund" opens a confirm dialog restating trip ID, amount (formatted), and reason; Confirm calls the existing refund API, Cancel closes without submitting | API failure after Confirm surfaces via the existing `showError`/`#error` element, same as today |
| Ops views driver documents | A driver row's "View documents" clicked | Opens a dialog with each document type as a `dt`/`dd` pair showing the decrypted value (or the existing "Demo checklist item · no uploaded file" placeholder) | API failure surfaces via `showError` instead of opening the dialog |
| Dialog keyboard interaction | Either dialog open | Tab from the last focusable element wraps to the first; Shift+Tab from the first wraps to the last; Escape closes without side effects (native `<dialog>` behavior) | n/a |

</frozen-after-approval>

## Code Map

- `apps/console/src/main.ts` -- single-file console app. `render()` (line 4) builds the whole app shell as one template string including the "Refund preview" card (`#refund-trip`, `#refund-amount`, `#refund-reason`, `#refund-submit`) and wires `on('refund-submit', ...)` in the handler block right after (line 5) — currently calls `api('/api/operations/refund', ...)` directly with no confirmation. Add two `<dialog>` elements to the `render()` template (refund-confirm, documents-view), and change the `refund-submit` handler to open the refund dialog (populating its text from the current input values) instead of calling the API immediately; the dialog's own Confirm button makes the actual `api(...)` call.
- `apps/console/src/main.ts` `load()` (line 6) wires `[data-view]` buttons to `api('/api/operations/document-read', ...).then((x:any)=>alert(JSON.stringify(x.documents,null,2)))` — replace the `.then` with code that renders `x.documents` into the documents dialog's `dl` as `dt`(document type)/`dd`(decrypted value or placeholder) pairs and calls `.showModal()`.
- `apps/console/src/style.css` -- already has matching tokens (`--ink`, `--action`, `--line`, `--warn`). Add `dialog`/`dialog::backdrop` rules mirroring the mockup's values (`dialog{color:#17252b;max-width:min(30rem,90vw);border:1px solid #42545a;border-radius:12px;padding:1.4rem}dialog::backdrop{background:#142428aa}`) plus minimal `dl`/`dt`/`dd` spacing for the documents panel.
- `_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/mockups/key-screens.html` -- reference only (the `#refund-dialog` markup, its CSS, and its focus-trap `onkeydown` handler at the bottom of the `<script>` block); do not modify.
- `apps/console/index.html` -- not touched; dialogs live inside the `render()`-generated markup, consistent with how every other section of the app is built.

## Tasks & Acceptance

**Execution:**
- [x] `apps/console/src/main.ts` -- add a refund-confirmation `<dialog>` to the `render()` template and change `refund-submit` to open it (populated from the current form values) instead of calling the API directly; wire its Confirm button to the existing `api('/api/operations/refund', ...)` call and its Cancel button to close -- matches mockup screen 3
- [x] `apps/console/src/main.ts` -- add a documents `<dialog>` to the `render()` template and change the `[data-view]` handler to populate and open it instead of `alert(...)` -- improves FR11 usability, no functional change
- [x] `apps/console/src/main.ts` -- implement the mockup's focus-trap `Tab`/`Shift+Tab` keydown handler for both new dialogs, with `autofocus` on each Cancel button and `dialog.onclose` returning focus to the triggering button
- [x] `apps/console/src/style.css` -- add `dialog`, `dialog::backdrop`, and `dl`/`dt`/`dd` rules matching the mockup's values

**Acceptance Criteria:**
- Given the refund form is filled in, when "Submit eligible refund" is clicked, then a dialog opens restating the trip ID, amount, and reason, and the refund API is not called until Confirm is clicked.
- Given the refund confirmation dialog is open, when Cancel is clicked (or Escape is pressed), then the dialog closes and no refund request is sent.
- Given "View documents" is clicked for a driver, when the request succeeds, then a dialog opens showing each document type and its value as a labelled pair, with no `alert()` invoked.
- Given either dialog is open, when Tab is pressed on its last button, then focus moves to its first button (and vice versa with Shift+Tab) — the trap never lets focus leave the dialog.

## Implementation Notes

Implemented 2026-11-21. `apps/console/src/main.ts`: added `#refund-confirm-dialog` and `#documents-dialog` to the `render()` template, matching the mockup's dialog chrome. `refund-submit` now populates the confirm dialog's impact text and calls `showModal()` instead of calling the API directly; the dialog's own `refund-confirm-ok` makes the unchanged `api('/api/operations/refund', ...)` call, `refund-confirm-cancel` just closes. The `[data-view]` handler renders `x.documents` into `#documents-list` as `dt`/`dd` pairs and opens the documents dialog instead of `alert(...)`. Both dialogs got `onclose` (returns focus to the opener — a tracked `documentsOpener` variable for the per-row documents button, a fixed `#refund-submit` lookup for the single refund button) and `onkeydown` Tab/Shift+Tab focus traps. `apps/console/src/style.css` got `dialog`/`dialog::backdrop`/`dl`/`dt`/`dd` rules matching the mockup's values. No changes to `apps/rider`, `apps/driver`, `apps/api`, `packages/contracts`, or `index.html`.

**Reviewer fix during Tasks & Acceptance Verification (2026-11-21).** Live-driving the implementation (not just reading the subagent's report) surfaced a real bug it missed: the documents dialog's "Close" button (`#documents-close`) had no click handler at all — `documentsClose` was only referenced for `.focus()` and in the keydown trap, never wired to `.close()`. Escape closed it (native `<dialog>` behavior, no JS needed), which is what the subagent's own verification exercised, but clicking the Close button itself did nothing, leaving the dialog stuck open. Fixed with one line: `on('documents-close',()=>documentsDialog.close());`. Re-verified live after the fix: Close now closes the dialog and returns focus to the originating "View documents" button; re-tested the full refund flow (dialog shows exact restated trip/amount/reason, no API call fires until Confirm — confirmed via network-request count before/after — Confirm fires exactly one `POST /api/operations/refund` with the form's values and the resulting error surfaces via the existing `#error`/`showError` path); re-tested the refund dialog's own focus trap with real Tab/Shift+Tab key presses in both directions (Cancel→Confirm wrap and Confirm→Cancel wrap both correct).

**Patch round 1 (reviewer, 2026-11-21).** Three independent review layers (blind-hunter, edge-case-hunter, verification-gap) found 12 raised findings; triaged to 3 refuted, 3 deferred, 4 routed as patches (see Review Triage Log). Sent the 4 patches back to the original implementer subagent; it fixed all four, confined to the same two files. Re-ran `npm run typecheck`, `npm run build`, `npm test` across the whole workspace myself (not just the subagent's console-scoped check) — all pass. Live-verified each fix against the running stack:
- Input validation: clicking "Submit eligible refund" with empty fields no longer opens the dialog — confirmed `#refund-confirm-dialog.open === false` and the exact error text surfaced via `#error`.
- Double-submit guard: filled valid data, clicked Confirm, and immediately (before the response settled) confirmed `#refund-submit.disabled === true`; after the request resolved, confirmed both `#refund-submit` and `#refund-confirm-ok` were re-enabled.
- Documents double-click guard: clicked the same "View documents" button twice in immediate succession and confirmed the dialog opened cleanly with no `InvalidStateError` in the console (only the expected API 404 from the test trip ID).
- CSS token swap: confirmed `apps/console/src/style.css`'s `dialog` rule now reads `color:var(--ink);...border:1px solid var(--muted)`.

## Review Triage Log

Reviewed by blind-hunter, edge-case-hunter and verification-gap against the diff since `baseline_commit` (post-fix, including the `documents-close` handler I added during Tasks & Acceptance Verification). Findings deduplicated by shared root cause.

| Claim | Verdict | Evidence | Route |
|---|---|---|---|
| Document viewer loses data fidelity for non-scalar document fields, rendering `[object Object]` instead of formatted JSON (blind-hunter) | false | Refuted: `apps/api/src/service.ts` `readDocuments()` only ever sets `values[kind]` to the literal placeholder string or a decrypted `.toString('utf8')` buffer — always a string, never an object. Independently confirmed by edge-case-hunter's own trace. | reject |
| `refund-submit` opens the confirm dialog without validating Trip ID/amount first, showing nonsense like "Trip . Refund ₹NaN." or "₹0.00" before the user even confirms (blind-hunter, edge-case-hunter ×2) | medium | Confirmed real: no guard before populating `#refund-confirm-impact` and calling `showModal()`. Mitigated but not excused by the backend (`apps/api/src/service.ts` `refund()` rejects `amount<=0` and an unknown trip ID), so no invalid refund can actually be submitted — but the dialog itself can show misleading text first. | patch |
| Nothing prevents reopening "Submit eligible refund" and clicking "Confirm refund" again while a prior refund request for the same trip is still in flight — each confirm mints a fresh `requestId`, so the backend's `refund:{tripId}:{requestId}` idempotency key differs and will not dedupe, risking two real refunds for one trip (blind-hunter) | medium | Confirmed: `refund-confirm-ok` has no in-flight guard and `crypto.randomUUID()` is fresh per click; verified in `apps/api/src/service.ts` `refund()` that the idempotency key includes `requestId`, so two distinct confirms are two distinct, both-processed work items. This defeats the confirmation step's own stated purpose (preventing accidental duplicate submission). | patch |
| The hand-rolled Tab/Shift+Tab trap duplicates behavior a native modal `<dialog>` already provides via background `inert`, adding complexity for no clear benefit (blind-hunter) | low | No demonstrated conflict or bad outcome — the trap was live-verified working correctly in both directions during Tasks & Acceptance Verification. A style/simplification opinion, not a defect; removing tested, working code to rely on cross-browser `inert` behavior is its own (small) risk. | reject |
| Neither dialog can be dismissed by clicking its `::backdrop`, only Cancel/Close/Escape (blind-hunter) | medium | Confirmed real, but confirmed to be an exact match of the approved mockup's own behavior — `key-screens.html`'s script wires no backdrop-click handler either, only Tab-trap and button clicks. Inherited UX-design decision, not introduced by this diff. | defer |
| New `dialog` CSS rule hardcodes `color:#17252b`/`border-color:#42545a` instead of the existing `var(--ink)`/`var(--muted)` tokens (blind-hunter) | low | Confirmed: `style.css` already defines `--ink:#17252b` and `--muted:#42545a` — identical values. Spec's Design Notes directed copying the mockup's literal hex values, so this isn't a spec deviation, but swapping to the existing tokens is a zero-risk, zero-visual-change maintainability fix. | patch |
| No test coverage accompanies a safety-relevant change (refund confirmation, document access); a wiring mistake (e.g. Confirm wired to the wrong button) would ship with every existing check green (blind-hunter, verification-gap with a concrete jsdom/vitest test proposal for the refund flow; verification-gap separately flagged the documents dialog as lower-stakes) | medium | Confirmed real: `apps/console` has no test script or test tooling at all (`package.json` only has `dev`/`build`/`typecheck`); the root `test` script only runs `apps/api`. Fix (standing up vitest+jsdom for this workspace from scratch) is not a trivial patch — it's scope already tracked as its own deferred item ("End-to-end acceptance-test coverage mapped to each of the 6 epics' stories") in `deferred-work.md`. | defer |
| `documentsOpener` could reference a DOM node detached by another action's `load()` redraw while the documents dialog is still open, so `onclose` would silently fail to return focus anywhere (edge-case-hunter) | false | Refuted: the console has no `setInterval`/polling (`grep -c setInterval` → 0), and every other action that calls `load()` is behind a button that's `inert` while a modal `<dialog>` is open via `showModal()`. There is no way to trigger a background redraw while the documents dialog is open. | reject |
| Clicking "View documents" twice in quick succession (same or different driver) before the first `document-read` response resolves calls `showModal()` on an already-open dialog, which throws `InvalidStateError`, surfacing as a confusing error via `showError` (edge-case-hunter) | low | Confirmed real: no `if(!documentsDialog.open)` guard before the unconditional `showModal()` call in the `[data-view]` handler's `.then()`. Fix is a one-line guard. | patch |



Reuse the exact dialog CSS from the mockup rather than inventing new values:
```
dialog { color:#17252b; max-width:min(30rem,90vw); border:1px solid #42545a; border-radius:12px; padding:1.4rem }
dialog::backdrop { background:#142428aa }
```
The mockup has no documents-viewing screen to copy, so its structure (a `dl` of document-type/value pairs inside the same dialog chrome) is this spec's own design call — keep it visually consistent with the refund dialog (same `dialog`/`.row`/button styles) rather than introducing a third pattern.

## Verification

**Commands:**
- `npm run typecheck` -- expected: all four workspaces pass with no errors
- `npm run build` -- expected: api tsc and console vite build succeed
- `npm test` -- expected: existing 9 API tests still pass (console-only UI change, should be unaffected)

**Manual checks (if no CLI):**
- Open the console at `http://localhost:5173`, sign in as Jo, fill the refund form for a completed trip and confirm the dialog opens, Cancel discards it, and Confirm actually submits the existing refund request.
- Click "View documents" for a driver application and confirm a dialog (not a browser `alert()`) shows the document values.
- With either dialog open, Tab/Shift+Tab through its buttons and confirm focus never escapes to the page behind it.
