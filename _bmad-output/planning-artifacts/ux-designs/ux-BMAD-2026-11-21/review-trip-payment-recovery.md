# Trip and payment recovery validation

The findings concern the written design and its static HTML reference. Runtime checks below are proposed tests. No app, dispatch service, payment provider or ledger was exercised.

### 1. High — A declined authorization leaves the rider without a booking outcome

**Location and evidence.** `EXPERIENCE.md:36,75` covers a lost confirmation and requires authorization success before dispatch. It gives no rider-facing result for a confirmed decline. A rider cannot tell whether to wait for a driver or address the payment failure. PRD R07 and finalized Story 2.4 (`epics.md:205–207`) distinguish a decline from a lost response.

**Proposed fix.** Add a booking state that says authorization failed and the driver search did not start. Give the rider an action to review the supported payment method. Keep the existing request lookup for an unknown outcome.

**Acceptance check.** In a static walkthrough, the decline shows the failure and payment action. A lost response shows a status check before retry. At runtime, simulate each outcome and verify zero driver offers after a decline and one request with at most one hold after reconnect.

### 2. High — “No driver found” omits what happened to the rider’s money

**Location and evidence.** `EXPERIENCE.md:40,50,54` specifies the timeout, retry and hold-release terminology, but never places the fare outcome and hold status on the timeout screen. A rider deciding whether to retry could mistake an outstanding hold for a fare. UX Strategy §5.2 and its dispatch-timeout row require both disclosures. PRD R07 and Stories 2.6 and 4.2 (`epics.md:226–227,326`) define the underlying outcomes.

**Proposed fix.** Place “No fare charged” beside “No driver found.” When a hold exists, show its actual release status above **Try again**.

**Acceptance check.** Inspect timeout variants with no hold, release requested and release confirmed. Each shows the fare outcome and retry action. Only the confirmed variant says the hold was released. At runtime, replay settlement and verify that the unused hold is released and no fare is captured.

### 3. High — The failed-capture receipt lacks an explicit amount and payment action

**Location and evidence.** `EXPERIENCE.md:53,87` preserves Completed and says Mira settles a balance. Neither passage specifies where she sees the outstanding amount or which control starts recovery. `DESIGN.md:72` allows a recovery panel to show money **or** timing. UX Strategy §5.4, PRD R07 and Story 4.2 (`epics.md:324–325`) require an actionable failed balance and distinguish confirmed failure from a pending capture.

**Proposed fix.** On the receipt, pair **Trip · Completed** and **Payment · Failed** with the outstanding amount, currency and **Resolve payment**. Show the supported method in that flow. Keep an unknown capture pending until the provider confirms the outcome.

**Acceptance check.** Walk from history to a failed receipt and identify the amount owed and the action to settle it on that screen. The pending variant offers no second payment. At runtime, replay a successful recovery callback and verify one settlement, zero outstanding balance and a Paid receipt for the same completed trip.

### 4. Medium — The refund preview does not identify the destination method

**Location and evidence.** `mockups/key-screens.html:13` shows trip 1042, ₹45.00 and the reason, but names the destination only as “the original payment method.” Neither the dialog anatomy in `DESIGN.md:73` nor the refund flow in `EXPERIENCE.md:88–89` supplies a masked identifier. UX Strategy §7.2 explicitly requires the masked method in the preview for the audited refund authorized by PRD R11 and Story 4.5 (`epics.md:351–355`).

**Proposed fix.** Show the masked method from the captured transaction beside the refund amount before **Confirm refund**.

**Acceptance check.** Using a fictional transaction, an agent can identify the trip, amount, currency and masked destination from the static confirmation. At runtime, verify the preview matches the captured transaction even if the rider has since changed the payment method on file.
