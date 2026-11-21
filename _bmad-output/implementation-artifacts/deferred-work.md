# Deferred Work

- source_spec: none
  summary: Live driver location push from the driver app and rider-side map tracking display (closes Epic 3's tracking gap; API endpoint already exists at `operations/location` — apps/api/src/service.ts `location()`).
  evidence: Split from "build the product" intent on 2026-11-21; user chose to start with the UI rebuild to match mockups instead.

- source_spec: none
  summary: Earnings/payout UI (driver-side earnings-to-payout trace, ops payout trigger) and a scheduled payout cadence (currently `payout-run` is a manual action, not cron-triggered).
  evidence: Split from "build the product" intent on 2026-11-21; user chose to start with the UI rebuild to match mockups instead.

- source_spec: none
  summary: End-to-end acceptance-test coverage mapped to each of the 6 epics' story acceptance criteria in epics.md (currently only 9 unit tests covering pure business-rule functions).
  evidence: Split from "build the product" intent on 2026-11-21; user chose to start with the UI rebuild to match mockups instead.

- source_spec: `_bmad-output/implementation-artifacts/spec-ui-rebuild-match-mockups.md`
  summary: Rebuild the ops console's refund confirmation flow (native `<dialog>` with focus trap, replacing `prompt()`) and the driver-documents view (structured panel, replacing `alert(JSON.stringify(...))`) to match the mockup's "Operations · Review a refund" screen.
  evidence: Spec exceeded the 1600-token guideline (2283 tokens); split by app so rider/driver mobile UI and ops console UI ship as independent passes.

- source_spec: `_bmad-output/implementation-artifacts/spec-ui-rebuild-match-mockups.md`
  summary: Rider's pickup field (and new "Use south entrance pin" quick-set button) stays editable after a quote is held with no fare/ETA refresh, so the displayed pickup can diverge from what's actually quoted and booked.
  evidence: Review found this real but inherited from the approved mockup itself (`key-screens.html` screen 4 has the identical non-refreshing interaction) and partially pre-existing (the pre-diff code had the same gap for the pickup field). `book()` only sends `quoteId`, so the server-side booking is unaffected — display-only risk. Revisit if the mockup/UX design is ever revised to add a live re-quote-on-edit affordance.

- source_spec: `_bmad-output/implementation-artifacts/spec-ui-rebuild-match-mockups.md`
  summary: On the rider's "Identify the car" screen, "Call emergency services" sits in a secondary 3-up row while the non-urgent "Contact driver" is the sole primary action — arguably conflicts with UX principle 1 ("keep safety actions within reach") outranking principle 4 ("one primary action per screen").
  evidence: Confirmed exact match to the approved mockup's own layout (`key-screens.html`: `Contact driver` is the only `.primary`; Share/Report/Call-emergency share a secondary `.row`). This is a UX-design decision made before this build story, not a defect introduced by it — raise against the mockup/UX design artifacts (DESIGN.md/EXPERIENCE.md) if it should change.

- source_spec: `_bmad-output/implementation-artifacts/spec-ui-rebuild-match-mockups.md`
  summary: Driver name (`||'Ravi'`) and vehicle plate (`||'AB 1234'`) fall back to hardcoded demo values with no empty/error state if `trip.driver` is ever actually missing while a trip is Assigned/Driver-arrived.
  evidence: Confirmed pre-existing — identical fallback literals were already present before this diff; it only relocated them into the new detail-row/panel layout. Worth an explicit loading/error state if `trip.driver` becomes a real nullable field later.

- source_spec: `_bmad-output/implementation-artifacts/spec-console-ui-match-mockups.md`
  summary: Neither the console's new refund-confirm dialog nor its documents dialog can be dismissed by clicking the `::backdrop`, only via Cancel/Close or Escape.
  evidence: Confirmed exact match to the approved mockup's own behavior — `key-screens.html`'s script wires Tab-trap and button clicks but no backdrop-click-to-dismiss handler either. Inherited UX-design decision, not introduced by this diff; raise against the mockup/UX design artifacts if backdrop dismissal should be added.

- source_spec: `_bmad-output/implementation-artifacts/spec-console-ui-match-mockups.md`
  summary: No automated test coverage exists for the console's refund-confirmation wiring (Confirm/Cancel bound to the right buttons, no premature or duplicate `/api/operations/refund` call) or the documents dialog, and `apps/console` has no test script or test framework at all today.
  evidence: Verification-gap review confirmed a wiring mistake here (e.g. Confirm accidentally wired to Cancel's handler) would ship with every existing check green. Standing up vitest+jsdom for this workspace from scratch is not a trivial patch — fold into the already-deferred "End-to-end acceptance-test coverage mapped to each of the 6 epics' stories" item above when that work starts.

- source_spec: `_bmad-output/implementation-artifacts/spec-live-location-tracking.md`
  summary: No automated test coverage exists for the driver's automatic location-reporting effect (gating on trip status, epoch/sequence correctness, interpolation math) or the rider's haversine distance calculation — `apps/rider` and `apps/driver` have no test infrastructure at all today.
  evidence: Verification-gap review found a regression here (e.g. inverted gating, swapped lat/lng in the haversine formula) would ship undetected by every existing check. Fold into the already-deferred "End-to-end acceptance-test coverage" item when that work starts; when it does, extract the interpolation/distance math into plain importable functions so they can be unit-tested without rendering.
