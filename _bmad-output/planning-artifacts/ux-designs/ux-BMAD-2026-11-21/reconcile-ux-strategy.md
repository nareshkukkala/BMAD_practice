# UX strategy reconciliation

| Source idea | Disposition in the pilot design | PRD |
| --- | --- | --- |
| Persistent status card, prominent plate, native controls, driver night mode, keyboard console | Retained across the visual and interaction specifications. | R05, §5 |
| Rematch immediately after driver cancellation | Ask the rider whether to keep searching. Disclose zero rider cancellation fee and retain the same request on rematch. | §3, R06 |
| Protect against duplicate bookings by disabling Confirm | Retain immediate visual feedback and restore the authoritative request on network retry. | R02, §5 |
| Display a pickup PIN from assignment | Specify where the rider sees it, when the driver enters it and when it disappears. Show the PIN exclusively to the rider who shares it in person. | R05 |
| Block the next booking after a failed capture | Expose the recoverable balance. A future-booking restriction requires a policy decision. | R07 |
| Reassure drivers that a failed payout is safe | Show the processor-confirmed status and an investigation path. Display hold releases and refunds as confirmed only on evidence. | R07–R08 |
| Map replay and two-sided trip sharing | Provide a role-scoped timeline, restrict precise location to active-trip uses, and give the rider the expiring share link. | R09, R11, §5 |
| Swipe to finish, emergency confirmation sheet | Use accessible completion controls and direct device calling. Capture an early-end reason when applicable. | §3, R09, §5 |
| Offer earnings previews, countdown research and vehicle information beyond the PRD | Retain as research candidates. Driver offer comprehension uses available pickup ETA and expiry. Additional fields depend on product approval and reliable data. | R04–R05 |
| UX conversion and retention goals as expansion gates | Preserve them as diagnostic research. Use the PRD’s agreed pilot targets, two-week window, volume and safety and billing conditions for the expansion decision. | §§6–7 |

**Delivery impact.** Story 3.3 can use the proposed rider-card PIN treatment for design review. Existing stories already cover rematch choice, payment recovery, trip privacy and accessible booking. Processor policy and zone/hour reporting attribution remain open with their owners. No sprint reordering is required by these UX corrections.
