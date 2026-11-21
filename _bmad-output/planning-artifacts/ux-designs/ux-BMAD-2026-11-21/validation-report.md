# Ride-hailing pilot UX validation

**Remediation update.** All eight findings were addressed in the design specifications and preview after this review. Markup and simulated interaction checks passed. Native screen-reader, dialer and payment-provider acceptance checks remain pending. The findings below document the original review.

2026-11-21T13:56:31+05:30

[Visual specification](DESIGN.md) · [Interaction specification](EXPERIENCE.md) · [Static reference](mockups/key-screens.html)

## Summary

The handoff keeps trip and payment state separate and requires consent to a refreshed quote. The remaining gaps occur at decisions a person must make under pressure: calling for help, accepting a changed fare, and deciding whether to wait, retry or settle a balance.

5 high, 3 medium findings.

## Lens results

- **Accessibility — Needs revision.** Address entry and scalable text are specified. Four controls or transitions need explicit assistive-technology behavior.

- **Trip and payment recovery — Needs revision.** Rematching, authoritative trip state and pending payments have defined behavior. Four financial decisions need clearer on-screen evidence.

## Findings by severity

### HIGH · Identify emergency calling by its spoken action

Accessibility · EXPERIENCE.md · Interaction Primitives / Story 5.2

Both static trip screens label Emergency as text. The handoff leaves the actionable role and spoken label implicit.

**Change and test.** Specify a native “Call emergency services” button. On each mobile platform and in both roles, locate it with a screen reader at the largest text size and open the configured dialer. Stop before placing a call.

### HIGH · Announce a changed fare before confirmation

Accessibility · EXPERIENCE.md · Quote sheet / Story 2.3

Focus can stay on Confirm during quote refresh while the rider misses the new amount.

**Change and test.** Announce the old and new localized totals once and include the current fare in the button name. Verify focus remains and only explicit acceptance creates a request.

### HIGH · Distinguish authorization decline from a lost response

Trip and payment recovery · EXPERIENCE.md · Book and find the right car / Story 2.4

A confirmed decline has no specified rider-facing result. The rider may keep waiting for a driver.

**Change and test.** Show that the search did not start and offer payment review. Simulate a decline and a timeout separately. Expect zero offers on decline, and recovery of the existing request with at most one hold after a lost response.

### HIGH · Show the fare and hold outcome at dispatch timeout

Trip and payment recovery · EXPERIENCE.md · Searching ends / Stories 2.6 and 4.2

The timeout screen offers retry while the release terminology lives elsewhere. A rider could mistake an outstanding hold for a charge.

**Change and test.** Pair “No fare charged” with the actual hold status before Try again. Test no hold, release requested and release confirmed. Replaying settlement must produce no fare capture.

### HIGH · Expose the amount and next action after failed capture

Trip and payment recovery · EXPERIENCE.md · Completed, including early end / Story 4.2

The underlying strategy calls for recovery, but the receipt contract omits a concrete action and outstanding amount.

**Change and test.** Show Completed, Payment failed, amount and currency, and Resolve payment. Pending should offer status checking. Replay recovery success and verify one settlement and a zero balance.

### MEDIUM · Read back the refined pickup address

Accessibility · EXPERIENCE.md · Accessibility Floor / Story 2.2

The handoff supports manual entry and pin refinement but leaves spoken feedback for the resolved address implicit.

**Change and test.** Announce the settled address once. Verify both text entry and pin refinement produce the same pickup in the quote.

### MEDIUM · Define keyboard focus inside refund confirmation

Accessibility · DESIGN.md · Safe-action dialog / Story 4.5

The design covers return focus but leaves initial focus and traversal during the financial decision ambiguous.

**Change and test.** Specify a named modal, initially focus Cancel, and contain Tab and Shift+Tab. Verify cancel restores the opener and submits no refund.

### MEDIUM · Identify the refund destination

Trip and payment recovery · mockups/key-screens.html · Operations / Story 4.5

“Original payment method” gives the agent too little information to check the transfer.

**Change and test.** Preview the masked method attached to the captured transaction. Test a rider who changed their payment method after the trip.

## Verification

Design evidence only. Source links and token references resolved. The six specified text/background pairs ranged from 7.93:1 to 15.72:1. A static preview cannot verify assistive technology, service responses or ledger behavior. Run the acceptance checks in an interactive prototype or test build with simulated transactions.

## Individual reviews

[review-accessibility.md](review-accessibility.md)

[review-trip-payment-recovery.md](review-trip-payment-recovery.md)
