# Ride-Hailing MVP · UX Strategy

Nov 21, 2026 · @naresh

## 1. Executive summary

The UX goal for the pilot is **certainty under uncertainty**: at every moment, each rider, driver and agent knows what is happening, what it costs, and what to do next, even when the network, GPS or payment fails. Trust is what makes riders book again, and in a one-city, one-category pilot it is the only lever UX controls.

The PRD defines a correct system. This strategy makes that correctness visible. Three bets carry it:

1. **One source of truth on screen.** Every surface renders the server's trip state and payment state as two separate, labelled things. The UI never guesses, and it says when data is stale (R05, Section 5 Recovery).
2. **Make the offer legible.** Show the estimated pickup time, price breakdown, currency and quote expiry before confirmation. Explain permitted adjustments on the receipt.
3. **Every failure has a designed next step.** No driver found, failed capture, driver cancel and lost connection each get a screen with one primary action, not a generic error toast.

**North-star UX outcome:** a rider who books once in week 1 books again in week 2, with no support contact needed. Section 13 turns this into measurable targets that sit beside the PRD's pilot metrics.

**Scope of this document:** rider app, driver app and operations console for the MVP in the PRD (v0.1). Deferred features (scheduled rides, cash, promotions, surge) are excluded, but the design system leaves room for them (Section 12).

## 2. UX principles

Seven principles decide design arguments. When two conflict, the lower number wins.

| # | Principle | What it means in practice | Anti-pattern it rules out |
| --- | --- | --- | --- |
| 1 | Keep safety actions within reach | Both apps expose emergency calling and reporting during the trip. Riders can also share an expiring link. | A rider or driver must search through settings for help |
| 2 | Show the truth, including its age | Render server state; label stale location with last-updated time after 30 s | A car icon that keeps animating while data is frozen |
| 3 | Explain what the rider will pay | Show the quote and applicable cancellation fee before commitment. Itemize permitted adjustments on completion. | An unexplained difference between quote and receipt |
| 4 | One primary action per screen | Each state has a single obvious next step; secondary actions are visually quieter | Two equal buttons when the rider is under time pressure |
| 5 | Design for the curb, not the desk | Large targets, high contrast, glanceable status; works one-handed, in sun, while walking | Dense layouts tested only on office Wi-Fi |
| 6 | Failure is a designed state | Every error has a cause in plain words and a recovery action | A generic "Something went wrong" toast |
| 7 | Drivers are users, not supply | Driver screens are designed for focus and earnings clarity with the same rigour as rider screens | Driver app as an afterthought of the rider build |

These principles are the review checklist for every design critique and every release candidate.

## 3. Users and contexts of use

The three users differ most in attention span, not in skill. Riders give a few seconds at a time, drivers give a glance while driving, and agents give full attention but must handle many cases quickly.

| User | Context of use | Core anxiety | What the UX must give them | Primary device posture |
| --- | --- | --- | --- | --- |
| Rider | On the street, at night, in a hurry, maybe with bags or a child; weak signal is common | "Will a car come, what will it cost, and is this the right car?" | Price and ETA certainty, driver identity, live status, a clear way out | One-handed phone, portrait, glanced at repeatedly |
| Driver | In a moving vehicle, mounted phone, navigation running, sun glare | "Is this offer worth it, where exactly is the rider, and will I get paid?" | Fast offer decisions, precise pickup, earnings transparency, no distraction | Mounted phone, glance-only while moving, larger targets |
| Operations agent | Desk, multiple monitors, live queue, sometimes a rider or driver on the phone | "What actually happened on this trip, and am I allowed to fix it?" | One timeline of truth, safe actions with role checks, audit confidence | Desktop web, keyboard-heavy, long sessions |

**Edge personas to design for from day one:**

- **Low-vision or screen-reader rider:** must complete booking with address entry and accessible controls (PRD Section 5).
- **Location-denied rider:** permission declined or unavailable; manual address path is first-class, not a fallback (R01).
- **First-time driver in week 1:** documents pending or expiring; needs a clear account status and what to do next (R03).
- **Rider in an unsafe situation:** needs emergency call and incident report without hunting (R09).

**Open question:** pilot city and supported languages are still launch decisions (PRD Section 2). Personas need to be validated with local research once the city is fixed.

## 4. End-to-end experience map

The experience is designed state by state on the PRD's trip lifecycle (Section 3). Each state has one job on screen, and payment status is shown separately from trip status.

**Trip states:** Searching → Assigned → Driver arrived → In progress → Completed. Searching may end as No driver found. Searching, Assigned and Driver arrived may end as Cancelled.

After a pre-pickup driver cancellation, let the rider choose whether to keep searching on the same request or end it. No rider cancellation fee applies. Early drop-off ends in Completed with the early-end reason recorded.

| Stage | Rider job | Driver job | Ops visibility | Moment of truth |
| --- | --- | --- | --- | --- |
| Before booking | Set pickup and destination, see price | Go online, stay eligible | Zone status, supply coverage | Is the quoted price believable? |
| Searching | Wait with confidence | Receive and judge offers | Dispatch failures | Does a car come, or does the rider learn fast that none will? |
| Assigned | Recognise the car | Navigate to an exact pickup | Driver cancellations | Can the rider find the car and the driver find the rider? |
| Arrived and start | Board the right car | Verify PIN, start trip | PIN exceptions, no-shows | Is it the right person and the right car? |
| In progress | Feel safe, track route | Drive, not tap | Safety reports | Can help be reached in one tap? |
| After trip | Check fare, rate, get help | See earnings | Captures, refunds, payouts | Does the final fare match the quote? |

## 5. Rider app strategy

The rider app is built around one persistent **trip status card** that changes content by state but never changes place. Riders learn one location to look at, and that location always answers "what now?"

### 5.1 Booking flow (R01, R02)

1. **Verify and choose addresses.** Verify the rider’s phone before booking. Keep the entered addresses when verification needs a retry. Offer destination search, a location-derived pickup when permitted, and editable text fields for both endpoints.
2. **Pin refinement.** Draggable pickup pin with a snapped address label and an optional pickup note. Unsupported points show the reason inline ("Outside the service zone") and keep the pin editable.
3. **Quote sheet.** One card shows pickup ETA, total fare, currency, an expandable breakdown, payment method, and an expiry countdown in plain words ("Price held until 18:42").
4. **Confirm.** Label the action with the localized fare and show progress on tap. Authorize payment before dispatch where supported. On timeout or retry, retrieve the same request and its payment status before enabling another action.
5. **Expired quote.** The sheet refreshes in place and highlights the changed price. The rider must tap again to accept; the app never auto-accepts a new price.

### 5.2 Searching and assignment (R04, R05)

- **Searching:** show elapsed time and Cancel. Preview the currently applicable charge, including zero, before the rider confirms.
- **No driver found:** explain the dispatch timeout and offer **Try again**. Show no fare charged and the actual hold-release state. Obtain consent to any fresh quote.
- **Assigned:** show driver photo, name, vehicle plate and estimated pickup time. Make the plate the most prominent item at the curb.
- **Driver rematch:** “Your driver cancelled. No cancellation fee. Keep looking?” Offer **Find another driver** and **End request**. Start rematching only on the rider’s choice.

### 5.3 Pickup and live trip (R05, R09)

- **Pickup PIN:** show digits on the signed-in rider’s Assigned and Driver arrived card. Prompt the rider to match the plate and photo before giving the PIN to the driver at pickup. Hide it on trip start, cancellation or assignment loss. Exclude it from shared links and analytics.
- **Contact driver** opens the supported masked contact channel and explains that personal numbers stay private.
- **Stale location:** after 30 s without an update, the car marker greys out and the card shows "Last updated 45 s ago". ETA is labelled as approximate.
- **Safety bar** pinned during Assigned, Arrived and In progress: Share trip, Report, Emergency.

### 5.4 Cancellation and payment (R06, R07)

- **Cancel flow:** collect a reason and show the fee or “No fee” before final confirmation. Apply the configured policy and record the actor, reason and server timestamp.
- **Payment status** is a separate chip on the trip, never mixed with trip status: Authorised, Paid, Pending, Failed, Refunded.
- **Failed capture:** keep Completed visible alongside Payment failed and the recoverable balance. Offer **Resolve payment** using the supported digital method. Show Paid only after confirmation.

### 5.5 After the trip (R10)

- Completion screen: final fare against the quote, any itemised adjustment, early-end reason if applicable, and a one-tap rating.
- Trip history includes receipts, one rating per completed trip and **Get help with this trip**. A second rating submission leaves the rating count at one.

**Open decision:** grace period length and cancellation fee values are not yet set (PRD Section 8). Copy above uses placeholders.

## 6. Driver app strategy

The driver app is a **glance-first tool**: every screen used while the vehicle moves must be readable in under 2 seconds and operable with one large tap. Anything that needs reading or typing is moved to when the car is stopped.

### 6.1 Onboarding and account status (R03)

- A **checklist onboarding**: identity, vehicle, market documents, each with status (Not started, In review, Approved, Rejected with reason, Expiring on date).
- The home screen shows one account-status banner. Expiring documents warn early, with the date and an upload action. Suspension states the reason category and a support path.
- Blocked drivers keep access to trip history, earnings and support (R03). The Go online control is disabled with the reason beside it, never hidden.

### 6.2 Going online and receiving offers (R04)

- **Go online** is a single large toggle with clear state colour and text, not colour alone.
- **Trip offer card:** show pickup area, estimated pickup time and time remaining. Offer one large Accept control. Treat earnings estimates and trip-length previews as research candidates pending reliable inputs.
- Audio and haptic cue on offer arrival, with a distinct cue for expiry.
- **Concurrent acceptance:** wait for server assignment before navigating. If the offer expires or another driver accepts first, show the result in text and restore the current availability state.

### 6.3 Pickup and trip (R05, R06)

- **En route:** turn-by-turn handoff to navigation, rider first name, pickup note, masked call. The rider's pickup pin and note stay visible on the map.
- **Arrived:** a large Arrived button that records arrival and starts the visible grace-period timer. No-show becomes available only after the timer ends (R06).
- **Start trip:** a large-digit PIN pad. A wrong PIN gives a clear retry message; repeated failure offers **Contact support**, which runs the audited exception path (R05).
- **End trip:** while stopped, select **End trip**, review the destination or enter an early-end reason, then confirm. A standard accessible button supports the entire flow.

### 6.4 Earnings and payouts (R08)

- After each trip: earnings for that trip, with fees and adjustments itemised.
- The earnings tab shows completed-trip earnings, fees, signed adjustments, net amount and the corresponding payout. Distinguish a pending transfer from confirmed payment.
- **Failed payout:** show the processor-confirmed status, the affected amount and a support link. Operations investigates against the ledger before any further transfer.

**Research priority:** offer card content and countdown length must be validated in-vehicle during the internal field test. Earnings per online hour is still to be set after driver interviews (PRD Section 6).

## 7. Operations console strategy

The console is designed around **one trip timeline as the single record of truth**, with every action an agent can take living beside the evidence for it. Agents should never need to cross-check two screens to decide on a refund or a suspension.

### 7.1 Information architecture

| Area | Purpose | Key elements |
| --- | --- | --- |
| Live queue | Triage urgent cases during staffed hours | Urgent reports, acknowledgment time, dispatch failures, stale-location spikes, payment callback delays and reconciliation discrepancies |
| Trip detail | Understand one trip end to end | Role-scoped event timeline with server timestamps, separate trip and payment states, and linked cases. Precise location is limited to active-trip uses. |
| Driver profile | Decide on access | Document status and expiry, trip and cancellation history, suspension history with reasons |
| Rider profile | Resolve billing and safety | Trips, open balances, refunds, reports filed |
| Reconciliation | Match money records | Processor records against ledger, discrepancies flagged, payout investigation without re-issue (R08) |
| Zone controls | Run the marketplace | Pause new requests by zone while active trips continue (PRD Section 7) |

### 7.2 Safe-action pattern (R11)

Every action that changes account access or money uses the same four-step pattern, so agents build muscle memory and mistakes are rare:

1. **Show eligibility.** The action button explains why it is disabled when the role or trip state does not allow it.
2. **Preview impact.** Show the eligible amount, currency, affected trip and masked payment method. Describe driver-earnings effects only when confirmed by policy.
3. **Require a reason.** A structured reason code plus an optional note.
4. **Confirm and record.** The audit entry appears in the timeline immediately, with agent name and time.

For suspension, refund and zone pause, identify the affected account, amount or zone in the confirmation. Enforce role checks at submission. Show the recorded outcome and distinguish pending money movement from a settled refund.

## 8. State, failure and recovery UX

Each failure in the PRD gets a designed screen with a cause, a reassurance about money, and one primary action. This matrix is the design checklist and the basis for the field-test script in Section 14.

| Situation | Rider sees | Driver sees | Primary action | PRD ref |
| --- | --- | --- | --- | --- |
| Quote expired | Price refreshed in place, change highlighted | — | Accept new price | R02 |
| Duplicate tap or network retry | Single request continues, button shows progress | — | None needed | R02 |
| Unsupported pickup or drop-off | Name the unsupported endpoint beside its field | — | Edit address or move pin | R01 |
| Dispatch timeout | No driver found, fare and hold status shown separately | — | Try again | R04, R07 |
| Concurrent acceptance lost | — | "Trip taken by another driver" | Stay online | R04 |
| Driver cancels before pickup | No rider fee. Ask whether to continue | Cancellation reason recorded | Find another driver or end request | R04, R06 |
| Stale location over 30 s | Greyed marker, "Last updated 45 s ago" | Connection warning if own GPS is lost | Wait or contact driver | R05 |
| App reopened or connection restored | Server state reloaded, card jumps to current state | Same | None needed | R05, Section 5 |
| PIN mismatch | — | Retry message, then Contact support | Re-enter PIN | R05 |
| Rider no-show | Arrival timestamp and any policy-defined charge | Enabled after recorded arrival and configured grace period | Confirm no-show | R06 |
| Early drop-off | Completed with early-end reason on receipt | Reason required before completion | End trip | Section 3 |
| Capture failed | Trip Completed, payment chip Failed, balance banner | Earnings shown as pending only if policy says so | Update payment | R07 |
| Booking paused in zone | "Bookings are paused here right now" with reason category | Active trip continues normally | Check later | Section 7 |
| Payout failed | — | Confirmed transfer status and amount | Contact support | R08 |

**Rule for all rows:** money words (fee, charge, refund, no charge) appear on the same screen as the state change, never only in a later email or receipt.

**Open decision:** whether drivers see earnings for a trip whose capture failed depends on the payout policy, which Finance and Engineering have not set (PRD Section 8).

## 9. Trust, safety and privacy by design

Safety features only work if people find them in a stressful moment, so they get fixed positions and plain labels rather than clever ones.

**Safety (R09)**

- **Emergency** opens the device calling interface with the configured market emergency destination from either active-trip screen. A support report is optional.
- **Share trip** creates an expiring link. The sheet shows exactly what the recipient will see and when the link stops working.
- **Report an incident** from either app’s active trip or history. Confirm receipt with the trip reference. During staffed service hours urgent reports enter the escalation queue. Display acknowledgment when a responder actually acknowledges the report.
- **Identity match at pickup:** plate, photo and PIN form a three-step check, presented in that order on the rider card.

**Privacy (PRD Section 5)**

- **Permission priming:** ask for location only at the moment of need, with a one-line reason, and keep manual entry visible if declined.
- **Masked contact** is labelled so both sides know numbers are hidden.
- **Location visibility** is stated: the rider sees the driver's location only during an active trip, and the driver sees the pickup point, not the rider's live location after drop-off.
- **Analytics hygiene:** design specs mark which fields are sensitive so events never carry raw location, documents or payment data.

**Trust signals:** a recognizable plate and driver photo, an itemized receipt, and a support case linked to the selected trip.

## 10. Accessibility and inclusive design

The target is WCAG 2.2 AA on all three surfaces, with the PRD's hard requirement that the whole booking flow works without the map.

- **Map-free booking:** every map action has a text equivalent. Pickup and destination can be set by address; the pin position is announced as an address.
- **Live regions for status:** trip state, ETA and price changes are announced to screen readers (VoiceOver, TalkBack) once per meaningful change, not on every location tick.
- **Text descriptions** for pickup, ETA, price and status (PRD Section 5), e.g. "Driver Ravi, white hatchback, plate MH12 AB 1234, 4 minutes away."
- **Dynamic type** up to the largest system setting without truncating price, plate or PIN. Layouts reflow to a single column.
- **Colour is never the only signal:** online/offline, payment chips and stale state all carry text and an icon.
- **Targets** at least 48 × 48 dp on rider screens and larger on driver screens used while moving.
- **Time limits:** the quote countdown and offer countdown are announced, and an expired quote can always be refreshed without losing entered addresses.
- **Haptics and sound** support key moments (driver arrived, offer received) for riders and drivers with low vision.

Accessibility is a release gate: the internal field test includes at least one screen-reader booking run on iOS and on Android.

## 11. Content and microcopy

Voice: **calm, specific, and honest about money.** Short sentences, numbers over adjectives, and no blame on the user.

| Moment | Avoid | Use |
| --- | --- | --- |
| Searching | “Hang tight!” | “Looking for a driver near your pickup.” |
| No driver found | "Oops, something went wrong" | "No drivers are free nearby. You were not charged." |
| Quote expired | "Price changed" | "Your price hold ended. New price: ₹262 (was ₹245)." |
| Stale location | (silent) | "Driver location last updated 45 s ago." |
| Driver cancelled | “Trip cancelled” | “Your driver cancelled. No cancellation fee. Keep looking?” |
| Failed capture | "Payment error" | "Your trip is complete, but the payment didn't go through. Update your payment to settle ₹245." |
| Failed payout | “Error” | “Your payout failed. Contact support about this transfer.” |

**Content rules**

- Use one glossary across surfaces: Searching, Assigned, Driver arrived, In progress, Completed, Cancelled and No driver found. Label payment independently.
- Amounts always show currency and are formatted for the locale.
- Times are absolute for deadlines ("until 18:42") and relative for ETAs ("4 min").
- All strings are externalised from day one, since supported languages are still a launch decision.

## 12. Design system and interaction foundations

One shared design system with three density modes: **Rider** (comfortable), **Driver** (glance, larger type and targets, high-contrast night theme) and **Console** (compact, data-dense).

**Core components built first**

| Component | Used in | Must handle |
| --- | --- | --- |
| Trip status card | Rider, Driver | Every trip state, stale data, payment chip, safety bar |
| Quote sheet | Rider | Breakdown, expiry countdown, refresh-in-place |
| Offer card | Driver | Pickup ETA, offer expiry, accepted or unavailable result, optional audio and haptic cue |
| State and payment chips | All | Separate trip state and payment state, text plus icon |
| PIN display and PIN pad | Rider, Driver | Large digits, screen reader, retry and support path |
| Failure screen template | All | Cause, money reassurance, one primary action |
| Safe-action dialog | Console | Eligibility, impact preview, reason code, audit confirmation |
| Timeline | Console | Server timestamps, actor, event type, filters |

**Interaction foundations**

- Use native iOS and Android controls. Critical actions have labeled button paths usable by touch, keyboard or assistive technology.
- Dark mode is the default for the driver app at night to reduce glare.
- Motion only to show change of state; respects reduce-motion settings.
- Optimistic UI is **not** used for money or assignment; those wait for the server and show progress.
- Tokens for colour, type and spacing are platform-neutral so the system can absorb deferred features (scheduled rides, promotions, other car categories) without a rework.

## 13. UX metrics and instrumentation

UX metrics sit under the PRD's pilot metrics and explain why those move. All are built from the PRD's event list (quote display, confirmation, offer, assignment, arrival, start, completion, cancellation, capture, refund, escalation) plus the few UX events below. Thresholds are proposals for review, like the PRD's own.

| UX metric | Definition | Explains PRD metric | Proposed threshold |
| --- | --- | --- | --- |
| Quote-to-confirm conversion | Confirmations ÷ quote displays | Trip completion rate | Baseline in field test, then track by zone |
| Expired-quote re-accept rate | Re-accepted quotes ÷ expired quotes | Trip completion rate | Baseline in field test |
| Rider pre-assignment cancel rate | Rider cancels in Searching ÷ confirmed requests | Match rate | Baseline in field test |
| Pickup PIN first-try success | Trips started with first PIN entry ÷ trips started | Pickup time | ≥ 95% |
| Contact-before-pickup rate | Trips with a masked call or chat before pickup ÷ assigned trips | Pickup time, GPS drift risk | Falling week over week |
| Payment-recovery completion | Failed-capture balances settled in app within 7 days ÷ failed captures | Payment capture success | Set with Finance |
| Support contacts per 100 trips | Trip-linked cases ÷ completed trips × 100 | Support demand (PRD Section 1) | Falling week over week |
| Week-2 rider return | Week-1 first-time riders who complete another ride in week 2 ÷ all week-1 first-time riders. Segment by trip-linked support contact to test the UX hypothesis. | Repeat use | Set after pilot week 2 |
| Screen-reader booking success | Moderated test task completion | Accessibility requirement | 100% of test participants |
| Driver offer comprehension | Parked-vehicle test of pickup ETA and offer expiry recall | Driver cancellation rate | ≥ 90% of test participants, proposed research target |

**Additional UX events:** location permission result, pin adjusted, quote expired, PIN failed, stale-location shown, failure screen shown (by type), safety bar used. They follow the PRD rules: server timestamps, deduplicated by event ID, no raw location or payment data.

## 14. Research and validation plan

Research follows the PRD's three rollout stages. Each stage answers a different question and gates the next.

| Stage | Question | Methods | Participants | Exit criteria |
| --- | --- | --- | --- | --- |
| Pre-build (now) | Do we understand local riders and drivers? | Contextual interviews, ride-alongs, pickup-spot photo diary, competitor teardown | 8 to 12 riders, 8 to 12 drivers, 3 to 5 support agents | Validated personas, pickup pain points, offer-decision criteria |
| Prototype | Can people complete the core flows? | Moderated usability on clickable prototypes, first-click tests on quote and offer cards, screen-reader sessions | 5 to 8 per surface per round, 2 rounds | Booking and offer tasks complete without help |
| Internal field test | Does it hold up on the street? | Scripted runs of every row in Section 8, in-vehicle offer testing, weak-signal and denied-location runs | Internal staff on supported iOS and Android devices | No unresolved critical UX defects in the failure matrix |
| Closed pilot | Can the zone expand? | Review PRD metrics by zone and hour, ticket themes and driver feedback | Invited riders and verified drivers in staffed zones and hours | At least two consecutive weeks meeting agreed PRD targets, sufficient pre-agreed volume, zero known duplicate charges or unresolved reconciliation gaps, and no open release-blocking safety or money defects |

**Weekly UX health review in pilot:** top three failure screens by volume, top three support tags, one change shipped or queued per finding.

## 15. Roadmap, governance and open decisions

UX work runs in four phases matched to the PRD rollout, and each ends at a gate that the next phase depends on.

**Sequence:** discovery and prototype → internal field test → closed pilot → controlled expansion. Before opening a zone, verify driver supply and rehearse escalation, booking pause and active-trip recovery.

Phase dates are not set in the PRD; they should be fixed once the pilot city and build plan are confirmed.

**Governance**

- **Design review** against the Section 2 principles for every new screen; the failure matrix (Section 8) is checked for every state change.
- **Content owner** holds the state glossary and money copy; any change to a fee or price string needs Product and Operations sign-off.
- **Accessibility and safety** are release gates, not backlog items.
- **Pilot UX health review** weekly, with outcomes logged against Section 13 metrics.

**Open UX decisions**

| Decision | Why it matters for UX | Owner (from PRD) |
| --- | --- | --- |
| Pilot city and languages | Personas, copy, address formats, currency display | Legal and Operations |
| Grace period and cancellation fee values | Cancel and no-show copy, timer design | Product and Operations |
| Quote guarantee and adjustment rules | Receipt and fare-difference explanations | Product and Operations |
| Payment processor and authorisation support | Whether a hold is shown before dispatch | Finance and Engineering |
| Payout cadence and failed-capture earnings policy | Driver earnings and payout status screens | Finance and Engineering |
| Emergency routing, staffing and response SLA | Device call destination, urgent queue coverage and acknowledgment copy | Trust and Safety |

## 16. Design handoff

The [visual specification](../_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/DESIGN.md) and [interaction specification](../_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/EXPERIENCE.md) translate the strategy into rider, driver and operations screens. The PRD governs pilot scope and release criteria.
