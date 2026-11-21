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
