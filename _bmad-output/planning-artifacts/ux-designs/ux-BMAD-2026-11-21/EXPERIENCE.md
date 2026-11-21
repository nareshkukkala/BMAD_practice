---
name: Ride-Hailing MVP experience
updated: 2026-11-21
status: draft
sources:
  - "../../../../input/Uber_Ride_Hailing_PRD.md"
  - "../../../../input/Ride-Hailing MVP · UX Strategy.md"
---

## Foundation

Rider and driver apps use native controls on iOS and Android. Operations uses a keyboard-accessible desktop web console. The PRD sets release scope. [DESIGN.md](DESIGN.md) defines presentation. The three journeys below use fictional names for field-test scripts.

## Information Architecture

| Surface | Entry and destinations | What a person can do |
| --- | --- | --- |
| Rider booking | Sign-in → address search → quote → active trip | Verify phone, edit either endpoint, refine pickup by pin or address, add pickup notes, confirm the displayed price. |
| Rider active trip | Reopen from home → current status card | Read plate, ETA and freshness, find pickup PIN, contact driver, cancel, choose rematch, share, report or call emergency services. |
| Rider history | Completed or ended trip → detail → receipt, rating or help | Compare quoted and final fare, follow balance recovery, rate a completed trip once, create a linked case. |
| Driver account | Onboarding → document checklist → availability | Submit identity, vehicle and market documents. Expiry or suspension blocks new offers. History, earnings and support remain accessible. |
| Driver trip | Online → offer → navigation → arrival → PIN → active trip → completion | See pickup notes, use masked contact, record arrival, wait the configured grace period, verify, finish or record early drop-off. |
| Driver earnings | History → trip earnings → payout detail | See gross, fees, signed adjustments, net and transfer status. Open support with a transfer reference. |
| Operations | Queue → case, trip, driver or payment evidence → scoped action | Review documents and eligibility, investigate incidents, authorize exceptions, suspend, refund and reconcile. |
| Pilot operations | Alerts and zone/hour measures → affected zone → pause or resume | Inspect failed matches, stale updates, delayed callbacks and discrepancies. Preview the zone and preserve active trips when pausing new bookings. |

## Voice and Tone

Use plain verbs and say whose action is needed. “Your driver cancelled. No cancellation fee. Keep looking?” pairs with **Find another driver** and **End request**. “Trip completed · Payment pending” remains visible while the provider confirms capture. “Location last updated at 18:42” explains why the marker stopped. Localize times and currency, and fill amounts from the confirmed transaction.

## Component Patterns

| Component | Interaction |
| --- | --- |
| Trip status card | Restores server state on entry and reconnect. Order rider pickup content as driver identity, plate, instructions and PIN. Show Emergency and Report on both apps and Share trip for the rider. |
| Quote sheet | Preserve endpoints and focus on expiry. Announce the old and new localized totals once per changed quote. Update Confirm’s visible and accessible name with the new total and currency. Require explicit acceptance. If confirmation times out, recover the existing request before offering a retry. |
| Offer card | An offer expires on server time. Show acceptance in progress until assignment succeeds. A lost race clears the unavailable offer. A driver holds at most one active assignment. |
| Status labels | Read trip and payment separately. Show only confirmed provider facts about authorizations, releases, refunds and payouts. |
| PIN display and pad | Show PIN on the signed-in rider’s assigned/arrived card. Driver enters it when stopped after recording arrival. Wrong or missing PIN preserves Driver arrived. An authorized override needs a reason and audit record. |
| Recovery panel | Keep the affected trip and any fee visible. A retry after timeout may resume a request. After No driver found, Try again initiates a new search with a valid quote. |
| Safe-action dialog | Open a named modal describing the trip, amount, currency and masked method from the captured transaction, even if the rider later changed their default. Focus Cancel first. Tab and Shift+Tab cycle within the modal. Escape and Cancel dismiss it without submission and restore focus to the opener. On confirmation recheck eligibility, role and current state, record the reason once and display the result. Reconcile uncertain transfers before considering reissue. |
| Timeline | Use server times and trip ID. Show cancellation actor, reason and time, linked cases and audited actions. Limit sensitive evidence to authorized roles and precise location to active-trip uses. |

## State Patterns

| Trigger | Screen response and available action |
| --- | --- |
| Initial load or empty history | Label loading. Show an empty history message only after a successful response. On failure, retain context and offer retry. |
| Permission denied or endpoint outside zone | Keep both addresses editable. Name the unsupported endpoint and focus its error. Text selection and pin refinement update one resolved pickup address. Announce it once after the edit settles, retain it in the field, and carry it into the quote. |
| Authorization declined or response lost | On a confirmed decline, say “Payment authorization failed. Driver search did not start.” Offer **Review payment method**. If the response is unknown, show **Checking booking status**, keep the existing request reference and check it before enabling retry. |
| Dispatch timeout | Show **No driver found** and **No fare charged**. With no hold, omit the release line. With a hold, show **Release requested** or **Hold released** only as supported by provider evidence. Place **Try again** below those facts and obtain acceptance of any new price. |
| Driver cancels before pickup | Ask whether to search again on the same request. Ending the request incurs no rider fee for that driver cancellation. |
| Cancel or no-show | Preview applicable charge before rider confirmation. Record actor, reason and server time. No-show requires recorded arrival and elapsed configured grace. Refresh if the trip started while the dialog was open. |
| Offline or location older than 30 seconds | Show last confirmed state, age and connection label. Stop moving the marker. Reload authoritative state before applying queued actions. |
| Completed, including early end | Itemize permitted adjustments and show any early-end reason. Keep **Trip · Completed**. For confirmed failure show **Payment · Failed**, the outstanding amount and currency, and **Resolve payment** on the receipt. Open the supported payment method for recovery. While capture or recovery is pending, show **Check payment status** and withhold a second payment action. Confirmed settlement updates the same receipt to Paid with zero balance, including after duplicate callbacks. |
| Hold or payout uncertain | Distinguish release requested from release confirmed. Show pending, failed or paid transfer evidence. Support can investigate a discrepancy without issuing a second transfer. |
| Paused zone | Explain booking is paused for that pickup. Keep already active trips available on reconnect. |
| Shared trip expired or ended | Replace live content with “Tracking ended.” Stop location updates and clear the marker. Exclude the PIN and financial details from the recipient view. |

## Interaction Primitives

Give every drag, gesture or countdown an equivalent text control or status. Confirm destructive actions after showing impact. Preserve focus through quote refresh. Native emergency calling opens from the active trip with the configured destination. Queue acknowledgment is a separate responder action. Only show an acknowledgment once recorded.

## Accessibility Floor

On rider and driver active-trip screens, expose **Call emergency services** as a native button with the same spoken name. Activation opens the configured device dialer. Test each role with VoiceOver and TalkBack at maximum text size and stop before placing a call.

Follow platform font scaling, including the largest setting. Pair {colors.attention} with a written error. Use {spacing.target} and {spacing.driver-target} for touch targets in the applicable native units. Announce state changes once, allow users to focus expiry times on demand, and respect reduced motion. Give the console a visible focus ring, logical table headers, keyboard-accessible actions and focus restoration after dialogs.

## Responsive & Platform

In portrait and at large text sizes keep price, plate and PIN fully readable in the scrolling card. Offer native address search without the map. On the driver’s mounted phone, use the night palette in low light and defer typing and consequential decisions until stopped. At console zoom, stack evidence and action in document order. The [visual reference](mockups/key-screens.html) shows the reading order on three key surfaces.

## Key Flows

### Book and find the right car · R01, R02, R04, R05, R06, R09

1. Mira verifies her phone. With location denied, she types both addresses, adds the entrance note and reviews the quote. An unsupported drop-off prompts her to edit that field.
2. She accepts the valid total. If a payment authorization is required, dispatch waits for success. On a dropped response she returns to the existing request. A new price after expiry requires her consent.
3. The first driver cancels. Mira sees there is no fee and chooses **Find another driver**. When assigned again, she matches the photo and plate. **At the curb she can identify the correct car and give its driver the PIN without opening another screen.**
4. During the ride she can share an expiring link or report an incident. Urgent reports enter the staffed queue during service hours. Emergency opens the device calling interface independently of support.

### Get eligible, pick up and get paid · R03, R04, R05, R06, R08

1. Ravi submits the required documents. An authorized agent reviews them. Only approval with valid documents enables Go online. While parked he accepts a live offer and waits for the assignment.
2. He follows pickup navigation and the entrance note, then records arrival. If the rider is absent, the no-show action waits for the configured grace period. **The correct PIN starts this trip exactly once** even if the response is lost.
3. At drop-off he confirms completion, giving a reason for an early end. His earnings history ties the net amount to the relevant payout. A failed payout links to support with its reference.

### Explain a charge and resolve a case · R07, R08, R09, R10, R11

1. Mira sees Completed with Payment failed, settles the recoverable balance and reviews the receipt. She rates the completed trip once. She opens a trip-linked case about an adjustment.
2. Jo, an authorized agent, opens the case timeline and compares the quote, itemized fare, ledger and processor evidence. **Jo can explain the difference and preview an eligible refund before changing money.**
3. A refund requires permission, reason and an audit trail. A repeated callback leaves one ledger entry. A separate failed payout goes to reconciliation. Investigation carries no payment instruction.
4. During pilot hours Jo acknowledges urgent safety cases in the staffed queue. If zone conditions deteriorate, authorized operations can pause new requests in that zone while active trips finish.

## Field acceptance and open decisions

Run denied-location booking through confirmation and spoken status on iOS and Android with screen reader and enlarged text. Rehearse simultaneous accepts, rider-selected rematch, wrong PIN, weak connectivity, stale GPS, failed capture, duplicate callbacks, refund and payout discrepancy. Check proposed p95 quote response within 3 seconds, location visibility within 10 seconds under normal connectivity and stale marking after 30 seconds. Use server timestamps and deduplicated event IDs. Keep raw location, payment details, PINs and identity documents out of analytics.

The strategy supplies the proposed rider PIN delivery surface and timing for Story 3.3. Product and Engineering should verify assignment changes and PIN invalidation together. Provider selection, fees, grace periods, payout cadence, support hours and response SLA still require their owners. Marketplace also needs to choose the reporting zone and hour for cross-boundary trips before interpreting pilot ratios. Follow PRD §§6–7 for expansion.
