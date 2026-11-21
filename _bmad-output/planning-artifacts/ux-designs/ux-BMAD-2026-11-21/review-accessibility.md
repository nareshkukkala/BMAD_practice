# Accessibility findings

This review covers the two design specifications and their static HTML reference. The acceptance checks below require an interactive build. No device, keyboard or screen-reader results were collected.

### High · Emergency calling lacks a specified spoken action

**Static evidence.** Both active-trip examples render “Emergency” as bold text in a row with no control role or minimum target size (`mockups/key-screens.html:7,11–12`). The specifications describe reachability and the dialer destination but leave the spoken action unspecified (`DESIGN.md:67`, `EXPERIENCE.md:35,60`). Story 5.2 explicitly requires a rider or driver to identify and activate emergency calling by its spoken label (PRD R09 and UX Strategy §9).

**Proposed fix.** Specify a native button labeled “Call emergency services” in both safety bars. Annotate its target using the rider and driver minimums from DESIGN.

**Acceptance check.** On VoiceOver and TalkBack at the largest text size, navigate each app’s active-trip controls. Verify that focus reaches the named button and activation opens the dialer with the configured destination. End the check before placing a call.

### High · A refreshed fare can be missed at confirmation

**Static evidence.** The quote sheet keeps the accept button beside the refreshed amount (`DESIGN.md:68`). The interaction spec preserves focus, requires fresh acceptance and allows expiry to be read on demand, but gives no announcement or button label for a changed price while focus stays on Confirm (`EXPERIENCE.md:36,60,64`). UX Strategy §§5.1 and 10 call for a fare-labeled action and one announcement per meaningful price change. PRD R02 and Story 2.3 require informed acceptance of the fresh quote.

**Proposed fix.** On refresh, announce the expired quote and the old and new localized totals once. Update the focused button’s accessible name to include the new total and currency.

**Acceptance check.** With VoiceOver and TalkBack focused on Confirm, expire a quote and supply a different fare. Verify that the change is spoken once without moving focus, the button reads back the new fare, and a request is created only after explicit acceptance.

### Medium · Pickup refinement lacks spoken address feedback

**Static evidence.** The design offers address entry as an alternative to dragging and focuses an unsupported endpoint’s error (`EXPERIENCE.md:18,49,60,68`). It does not say how a rider hears the resolved address after refining pickup. UX Strategy §10 explicitly requires the pin position to be announced as an address. PRD §5 and Story 2.2 require accessible address selection without using the map.

**Proposed fix.** Bind the editable pickup field and pin to the same resolved address. After a refinement settles, announce the selected pickup address once and keep it available for review before quoting.

**Acceptance check.** With location denied, use VoiceOver and TalkBack to select and revise pickup by text. Verify that the final pickup address is spoken and carried into the quote. Repeat by moving the pin and verify that the settled address is spoken once and matches the pickup field.

### Medium · Refund confirmation defines return focus only

**Static evidence.** The dialog specifies return focus and the console requires keyboard access (`DESIGN.md:73`, `EXPERIENCE.md:41,64`). The refund reference presents Cancel and Confirm refund as spans, with no dialog name or indication of initial focus or Tab behavior (`mockups/key-screens.html:13`). This leaves the keyboard path through a money-changing decision ambiguous for the agents described in UX Strategy §§3 and 7.2 (PRD R11, Story 4.5).

**Proposed fix.** Specify a named modal dialog with the trip, amount and payment destination available as its description. Use buttons for both actions, initially focus Cancel and keep keyboard focus inside the open dialog.

**Acceptance check.** Open a test refund using only the keyboard with a desktop screen reader. Verify the dialog title and impact are read on entry, Tab and Shift+Tab stay within it, and cancelling returns focus to the opener without submitting a refund.
