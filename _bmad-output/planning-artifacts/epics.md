---
status: final
currentStep: step-04-final-validation
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - input/Uber_Ride_Hailing_PRD.md
---

# BMAD – Uber-Style Ride-Hailing Epic Breakdown

## Overview

The pilot covers immediate, point-to-point economy rides in defined zones of one city, with one digital payment method. Riders book and pay, drivers accept and fulfil trips, and operations agents manage eligibility, incidents and financial exceptions.

## Requirements Inventory

### Functional Requirements

- **FR1 · R01 · Rider sign-in and location selection.** Rider can verify a phone number, search for addresses, and adjust pickup on a map. With location permission denied, manual address entry remains available. Booking is blocked for unsupported pickup or drop-off points with a clear reason.
- **FR2 · R02 · Quote and confirmation.** Show pickup ETA estimate, fare breakdown, currency, and quote expiry before confirmation. Expired quotes require the rider to accept a fresh price. Repeated taps or network retries return the same request.
- **FR3 · R03 · Driver onboarding and availability.** Drivers submit identity, vehicle, and market-required documents. Only approved drivers with valid documents can go online. Expiry or suspension blocks new offers while preserving access to trip history and support.
- **FR4 · R04 · Dispatch and reassignment.** Rank eligible nearby drivers using pickup ETA and current availability. Offers expire. Concurrent acceptances produce exactly one assigned driver, and each driver can hold at most one active assignment. If dispatch times out, show No driver found and offer a retry.
- **FR5 · R05 · Pickup and live trip.** Show driver name, photo, vehicle plate, and ETA after assignment. Provide masked contact and navigation to pickup. Require a pickup PIN to start, with audited support handling for exceptions. Mark outdated location with a last-updated time. Reopening either app restores the authoritative trip state.
- **FR6 · R06 · Cancellations and no-shows.** Show any applicable charge before rider confirmation. Record the actor, reason, and timestamp. Driver cancellation before pickup has no rider fee and can trigger rematching. No-show requires recorded arrival and the configured grace period.
- **FR7 · R07 · Fare and payment.** Authorize payment before dispatch where supported by the chosen provider, then capture once on completion. Display the final fare and itemize any permitted adjustments. Release unused holds when a trip ends without a charge. Duplicate payment callbacks cannot create duplicate ledger entries. Failed capture creates a recoverable balance and gives the rider clear payment status.
- **FR8 · R08 · Earnings and payouts.** Drivers can see completed trip earnings, fees, adjustments, and payout status. Operations reconciles processor records against the ledger and can investigate a failed payout without issuing it twice.
- **FR9 · R09 · Safety and support.** Riders can share an expiring trip-tracking link. Riders and drivers can report an incident from the active trip or trip history. The app provides an emergency call entry point. Urgent reports enter a staffed escalation queue during service hours.
- **FR10 · R10 · Trip history and feedback.** Riders can open trip details and receipts, submit one rating per completed trip, and open a trip-linked support case. Drivers can review their own trip and earnings history.
- **FR11 · R11 · Operations console.** Authorized agents can view trip timelines, review driver documents, suspend drivers, and initiate eligible refunds. Actions that change account access or money require role checks, a reason, and an audit record.
- **FR12 · §3 · Trip lifecycle.** A confirmed valid quote enters Searching. The normal path continues through Assigned, Driver arrived, In progress and Completed. Searching may end in No driver found or Cancelled. Assigned and Driver arrived may end in Cancelled. After a pre-pickup driver cancellation, rematch if the rider still wants the ride. Record an early drop-off as Completed with an explicit early-end reason. Operations handles exceptional outcomes through an audited workflow.
- **FR13 · §3 · Independent payment status.** Keep a completed trip in Completed when its payment is pending, failed or refunded.
- **FR14 · §6 · Pilot events.** Record quote display, booking confirmation, offer, assignment, arrival, start, completion, cancellation, capture, refund and support escalation. Use server timestamps and deduplicate by event ID.
- **FR15 · §§5, 7 · Zone booking controls.** Operations can pause new requests by zone while active trips remain recoverable and can finish.
- **FR16 · §8 · Pickup instructions.** Let riders provide pickup notes alongside the editable pickup pin to help drivers find them. The PRD identifies this as proposed handling for GPS drift.

### NonFunctional Requirements

- **NFR1 · Recovery.** Booking, assignment, trip transitions and money movement are safe to retry. After reconnection, reload authoritative server state before applying a conflicting update. Active trips remain recoverable during a booking pause.
- **NFR2 · Performance.** Field-test the proposed targets of p95 quote response within 3 seconds, active-trip locations visible within 10 seconds under normal connectivity, and a stale indicator after 30 seconds.
- **NFR3 · Data protection.** Limit precise location sharing to active-trip uses, enforce role-based access, encrypt sensitive data and use provider tokens for payment. Exclude raw location, identity documents and payment details from analytics. Agree on market-specific retention before launch.
- **NFR4 · Accessibility.** Support screen readers and scalable text. Provide text descriptions for pickup, ETA, price and status. Riders can complete the booking flow using address entry and accessible controls.
- **NFR5 · Observability.** Alert operations to dispatch failures, spikes in stale locations, delayed payment callbacks and reconciliation discrepancies. Correlate incidents by trip ID without exposing sensitive data.

### Additional Requirements

The PRD is the sole planning input. Sections 6–8 supply the pilot measures, release criteria and decisions below.

**Pilot measures.** Review results by service zone and hour before expansion. Thresholds are proposed.

| Metric | Definition | Proposed threshold |
| --- | --- | --- |
| Trip completion rate | Completed trips ÷ confirmed requests, including unfulfilled and cancelled requests | ≥ 80% |
| Match rate | Requests assigned at least once ÷ confirmed requests | ≥ 90% |
| Pickup time | Rider confirmation to recorded driver arrival, for completed trips | p90 ≤ 12 min |
| Driver cancellation rate | Requests with a driver-initiated pre-pickup cancellation ÷ requests assigned at least once | ≤ 8% |
| Payment capture success | Paid completed trips within 24 hours ÷ completed trips requiring payment | ≥ 98% |
| Driver earnings per online hour | Net marketplace earnings ÷ online hours, including idle time | Set after driver onboarding interviews |
| Safety response and billing | Urgent case acknowledgment time, duplicate charges, and unresolved reconciliation gaps | Agree on response SLA before launch. Zero known duplicate charges or unresolved reconciliation gaps at expansion review. |

**Release criteria**

1. **Internal field test.** Verify the full lifecycle on supported iOS and Android devices. Include denied location permissions, weak connectivity, concurrent driver acceptance, rematching, failed capture, duplicate callbacks, refunds, and payout reconciliation.
2. **Closed pilot.** Launch in limited zones and hours with invited riders and verified drivers. Confirm supply coverage before opening each zone. Staff support and rehearse incident handling, booking pause, and active-trip recovery.
3. **Controlled expansion.** Expand after at least two consecutive pilot weeks meeting agreed targets, with sufficient trip volume agreed before pilot start and no unresolved release-blocking safety or money-movement defects. Operations can pause new requests by zone while allowing active trips to finish.

**Decisions and dependencies**

- The city, pilot hours and supported languages are open launch decisions. Marketplace limits zones and hours to match supply and monitors failed matches and driver earnings by zone.
- Product and Operations must define quote guarantees, permitted adjustments, cancellation fees and no-show grace periods before the pilot.
- Finance and Engineering must select the processor and finalize refund permissions, payout cadence and reconciliation ownership.
- Legal and Operations must confirm the market and sign off on operating permissions, insurance, driver checks and privacy requirements.
- Trust and Safety must agree emergency routing, urgent response SLA and staffing before bookings open.
- Agree the minimum trip volume before pilot start and set the earnings-per-online-hour target after driver interviews.

**Deferred scope.** Scheduled and shared rides, multi-stop itineraries, cash, subscriptions, promotions, airport-specific flows and dynamic pricing.

### UX Design Requirements

The PRD supplies the interaction requirements for this run. FR1 and NFR4 cover accessible booking and manual address entry. FR2, FR5–FR7, FR9 and FR16 cover quote disclosure, pickup identification and guidance, stale locations, fee confirmation, payment status and safety actions.

### FR Coverage Map

| Requirement | Epic coverage |
| --- | --- |
| FR1 | 2 — rider sign-in and supported addresses |
| FR2 | 2 — quote, expiry and retry-safe confirmation |
| FR3 | 1 — onboarding and eligibility. 5 — continued access to history and support after document expiry or suspension |
| FR4 | 2 — assignment and timeout. 3 — rematching |
| FR5 | 3 — pickup verification, live trip and recovery |
| FR6 | 3 — cancellation and no-show |
| FR7 | 2 — authorization. 3 — unused holds. 4 — final fare and capture |
| FR8 | 4 — earnings, payouts and reconciliation |
| FR9 | 5 — sharing, emergency calling and incident escalation |
| FR10 | 4 — receipts and earnings history. 5 — trip history, ratings and support cases |
| FR11 | 1 — driver review and suspension. 3 — audited trip exceptions. 4 — refunds. 5 — timeline investigation |
| FR12 | 2 — request and assignment. 3 — arrival through completion and alternate outcomes. 5 — exception investigation |
| FR13 | 4 — independent payment and trip status |
| FR14 | 6 — pilot measurement using events recorded in each relevant epic |
| FR15 | 6 — zone pause and active-trip continuity |
| FR16 | 2 — rider enters pickup notes. 3 — driver uses them |

## Epic List

### Epic 1: Get approved to drive
Drivers submit documents and go online after approval. Agents can suspend eligibility, and expired documents block new offers. **FRs covered:** FR3, FR11.

### Epic 2: Book a ride and find a driver
Riders choose supported addresses, add pickup notes, review an expiring quote and confirm once. Dispatch matches one eligible driver or offers a retry. Authorize payment before dispatch where supported. **FRs covered:** FR1, FR2, FR4, FR7, FR12, FR16.

### Epic 3: Meet the driver and complete the trip
Riders and drivers locate each other, verify pickup by PIN, recover trip state and complete the ride. Handle cancellation, rematch, no-show and early drop-off. **FRs covered:** FR4, FR5, FR6, FR7, FR11, FR12, FR16.

### Epic 4: Settle the fare and pay the driver
Riders see an itemized receipt and payment status. Drivers see earnings and payout status. Agents can refund eligible charges and reconcile payouts without moving money twice. **FRs covered:** FR7, FR8, FR10, FR11, FR13.

### Epic 5: Share a trip, give feedback, and get help
Riders share an expiring tracking link and rate a completed ride. Riders and drivers can access emergency calling and report incidents. Agents investigate trip timelines and escalate urgent cases. **FRs covered:** FR3, FR9, FR10, FR11, FR12.

### Epic 6: Operate the pilot by zone
Operations monitors matching, pickup times, safety response and payments by zone and hour. Agents can pause new bookings while active trips finish. Each preceding epic records the pilot events it produces. **FRs covered:** FR14, FR15.

## Epic 1: Get approved to drive

Drivers submit documents and go online after approval. Agents can suspend eligibility, and expired documents block new offers. These stories cover FR3, the driver-review and suspension parts of FR11, and the protection of identity documents in NFR3. The required document list depends on the launch market.

### Story 1.1: Submit driver documents

As a driver, I want to submit my identity, vehicle, and market-required documents so that operations can review my application. **Coverage:** FR3, NFR3.

**Acceptance Criteria:**

- **Given** I have supplied all documents required for my market, **when** I submit my application, **then** it becomes available for review and my status shows that approval is pending.
- **Given** a required document is missing, **when** I attempt to submit, **then** the app identifies the missing document and lets me supply it.
- **Given** I upload an identity document, **when** the system stores it and records submission analytics, **then** the stored document is encrypted and the analytics contain no document contents.

### Story 1.2: Review and approve a driver

As an operations agent, I want to review a driver’s documents so that I can approve drivers who meet the market’s requirements. **Coverage:** FR3, FR11.

**Acceptance Criteria:**

- **Given** I have review and approval permissions and have verified all required documents are valid, **when** I approve the application with a reason, **then** the driver’s status becomes approved and the audit record identifies the agent, driver, decision, reason, and time.
- **Given** a required document has expired or I omitted the decision reason, **when** I attempt approval, **then** the application remains pending and the console identifies what prevents approval.
- **Given** my role lacks access to driver documents, **when** I request one, **then** access is denied. **Given** my role permits review only, **when** I attempt approval, **then** the driver’s status stays unchanged.

### Story 1.3: Go online when eligible

As an approved driver, I want to go online when my documents are valid so that I can receive ride offers. **Coverage:** FR3.

**Acceptance Criteria:**

- **Given** I am approved, my required documents are valid, and I have no suspension, **when** I go online, **then** my app shows me as online and I become eligible for new offers.
- **Given** my approval is pending or a required document has expired, **when** I try to go online, **then** I stay offline and see the reason.
- **Given** I am already online, **when** a required document expires, **then** I become ineligible for new offers.

### Story 1.4: Suspend eligibility for new offers

As an authorized operations agent, I want to suspend a driver with a recorded reason so that I can stop new offers and account for the decision. **Coverage:** FR3, FR11.

**Acceptance Criteria:**

- **Given** I have suspension permission, **when** I suspend an online driver with a reason, **then** the driver becomes ineligible for new offers and an audit record captures the agent, driver, reason, and time.
- **Given** the suspension is active, **when** the driver attempts to go online, **then** the driver stays offline and the app explains the restriction.
- **Given** I lack suspension permission or have omitted the reason, **when** I attempt suspension, **then** the console refuses the action and the driver’s eligibility stays unchanged.

## Epic 2: Book a ride and find a driver

The rider can book with location permission turned off, see the price before confirming, and see a definite outcome even if the network drops or no driver accepts.

### Story 2.1: Verify a rider’s phone number

As a rider, I want to verify my phone number so that I can sign in and book a ride. **Coverage:** FR1.

**Acceptance Criteria:**

- **Given** my number is unverified, **when** I successfully complete phone verification, **then** I am signed in as the rider associated with that number.
- **Given** verification fails, **when** I attempt to book, **then** the app explains that verification is required and lets me try again.

### Story 2.2: Choose a supported pickup and destination

As a rider, I want to specify where I am and where I’m going so that the driver can find me and I can check the fare. **Coverage:** FR1, FR16.

**Acceptance Criteria:**

- **Given** I deny location permission, **when** I search for and select both addresses using a screen reader, **then** I can reach the quote step using labeled controls without interacting with a map.
- **Given** I select a pickup address, **when** I adjust the pin and add a pickup note, **then** the booking uses the revised point and retains the note for the assigned driver.
- **Given** either endpoint is outside the service area, **when** I try to proceed, **then** booking is blocked and the app identifies which endpoint I need to change.

### Story 2.3: Review a time-limited quote

As a rider, I want to see the estimated pickup time and price before I decide whether to book. **Coverage:** FR2.

**Acceptance Criteria:**

- **Given** both endpoints are supported, **when** I receive a quote, **then** I can read the pickup ETA, fare breakdown, currency, and expiry before confirming. Each value is available to a screen reader and remains readable with enlarged text.
- **Given** the displayed expiry has passed, **when** I confirm, **then** the app presents a fresh quote and requires my acceptance before creating a request.
- **Given** pilot field-test conditions, **when** quote response times are measured, **then** results show whether p95 meets the PRD’s proposed three-second target.

### Story 2.4: Confirm once and see the booking status

As a rider, I want one confirmation to create one ride request so that retrying after a dropped connection cannot book me twice. **Coverage:** FR2, FR7, FR12.

**Acceptance Criteria:**

- **Given** I accept a valid quote, **when** confirmation succeeds, **then** one request enters **Searching** and the app shows that status. Where the provider supports preauthorization, dispatch begins only after authorization succeeds.
- **Given** confirmation reached the server but its response was lost, **when** I reconnect and retry, **then** the app restores the same request and its current state. The retry creates neither a second request nor a second payment hold.
- **Given** the provider requires authorization and declines it, **when** I view the result, **then** I see the payment failure and no driver receives an offer.

### Story 2.5: Receive and accept an eligible offer

As an available driver, I want to accept a nearby pickup and know whether it is mine before I set out. **Coverage:** FR4, FR12.

**Acceptance Criteria:**

- **Given** a request is searching, **when** dispatch selects candidates, **then** it ranks eligible nearby drivers by pickup ETA and current availability. Offline, suspended, expired-document, and already-assigned drivers receive no new offer.
- **Given** two drivers accept the same live offer concurrently, **when** both acceptances are processed, **then** exactly one driver gets the assignment, the rider sees **Assigned**, and the other driver sees that the offer is unavailable.
- **Given** one driver accepts offers for two requests concurrently, **when** both acceptances are processed, **then** that driver holds at most one active assignment.
- **Given** an offer has expired, **when** the driver accepts it, **then** the driver sees that it expired and the acceptance leaves the request’s current assignment unchanged.

### Story 2.6: Retry an unsuccessful search

As a rider, I want to know when the search has ended so that I can decide whether to try again. **Coverage:** FR4, FR12.

**Acceptance Criteria:**

- **Given** no driver accepts before the dispatch timeout, **when** I view or reopen the app, **then** the request shows **No driver found** and offers a retry.
- **Given** I choose retry, **when** the next search begins, **then** the previous request retains its outcome. If the quote has expired, I must accept a fresh price first.

Across these stories, quote display, booking confirmation, offer, and assignment each produce a server-timestamped event that can be deduplicated by event ID. Analytics exclude raw locations and payment details.

## Epic 3: Meet the driver and complete the trip

Riders and drivers locate each other, verify pickup, recover trip state and record the outcome of a completed or interrupted trip.

### Story 3.1: Find each other at pickup

As a rider, I want to identify my driver and give them a precise pickup point so that we can find each other. **Coverage:** FR5, FR16.

**Acceptance Criteria:**

- **Given** a driver is assigned, **when** I open the trip, **then** I see the driver’s name, photo, vehicle plate, and pickup ETA. The plate, ETA, and trip status are readable with a screen reader.
- **Given** I moved the pickup pin and added a note during booking, **when** my driver opens pickup navigation, **then** the destination matches the revised pin and the note is visible.
- **Given** either of us initiates contact from the assigned trip, **when** the connection opens, **then** each person’s phone number stays private.

### Story 3.2: Recognize an outdated location and recover the trip

As a rider or driver, I want to know how current the trip information is so that I can act on it after a connection drops. **Coverage:** FR5, NFR1, NFR2.

**Acceptance Criteria:**

- **Given** normal connectivity, **when** an active-trip location changes during a field test, **then** the test records the time until the update is visible and checks it against the proposed 10-second target.
- **Given** the latest location update is more than 30 seconds old, **when** I view the trip, **then** the app marks the location as stale and displays its last-updated time.
- **Given** either app disconnects and the trip changes state, **when** I reopen or reconnect, **then** the app reloads the server state before applying a queued action. An action that conflicts with the current state cannot move the trip backward.

### Story 3.3: Record arrival and verify the rider

As a driver, I want to record my arrival and verify the rider’s pickup PIN so that I start the correct trip. **Coverage:** FR5, FR11, FR12.

**Acceptance Criteria:**

- **Given** I am the assigned driver, **when** I mark arrival, **then** both apps show **Driver arrived** and the trip records one arrival timestamp, including if I retry.
- **Given** the trip is **Driver arrived**, **when** I enter its valid PIN, **then** both apps show **In progress** and the trip records one start. A missing, incorrect, or different trip’s PIN leaves the trip at **Driver arrived**.
- **Given** pickup verification requires a support exception, **when** an agent attempts an override, **then** only an authorized agent who supplies a reason can complete it. The audit record identifies the trip, agent, reason, time, and resulting state.

### Story 3.4: Cancel with the fee visible before confirming

As a rider, I want to see what cancellation will cost before I decide whether to keep waiting. **Coverage:** FR6, FR7, FR12.

**Acceptance Criteria:**

- **Given** my trip is **Searching**, **Assigned**, or **Driver arrived**, **when** I open cancellation, **then** I see the applicable fee, including zero. Leaving the confirmation screen preserves the trip.
- **Given** I confirm while cancellation is still allowed, **when** the request is processed, **then** the trip becomes **Cancelled** and records the actor, reason, and timestamp once. If the trip ends without a charge, any unused payment hold is released.
- **Given** the trip started after I opened the confirmation screen, **when** my cancellation reaches the server, **then** the app shows **In progress** and no cancellation fee is created.

### Story 3.5: Choose whether to rematch after a driver cancels

As a rider, I want to choose whether to keep searching when my driver cancels before pickup. **Coverage:** FR4, FR6, FR12.

**Acceptance Criteria:**

- **Given** my driver cancels before pickup, **when** the cancellation is recorded, **then** I see that the driver cancelled and that I owe no rider cancellation fee. The record identifies the driver as the actor and includes the reason and time.
- **Given** the assignment has ended, **when** I choose to keep searching, **then** the same trip returns to **Searching** and the previous driver can no longer start it. If I decline, the trip ends as **Cancelled** and any unused hold is released.

### Story 3.6: Record a rider no-show

As a driver, I want to report a no-show after waiting at pickup so that the trip has an accurate outcome. **Coverage:** FR6, FR12.

**Acceptance Criteria:**

- **Given** arrival has never been recorded, or the configured grace period has yet to elapse since recorded arrival, **when** I report a no-show, **then** the action is refused and the trip state is preserved.
- **Given** the trip is still **Driver arrived** and the full grace period has elapsed, **when** I confirm a no-show, **then** the trip becomes **Cancelled** with the actor, no-show reason, and timestamp recorded once.

### Story 3.7: Complete a ride, including an early drop-off

As a driver, I want to record where the ride ended in its lifecycle so that the rider and I see the same outcome. **Coverage:** FR12.

**Acceptance Criteria:**

- **Given** the trip is **In progress**, **when** I finish at the destination, **then** both apps show **Completed** and the server records one completion, including if I retry after losing the response.
- **Given** the rider exits early, **when** I finish the trip with an explicit early-end reason, **then** the trip is **Completed** with that reason. An early-end submission missing its reason leaves the trip **In progress**.

Arrival, start, cancellation, and completion events use server timestamps and are deduplicated by event ID. Cancellation fees and the no-show grace period remain pilot decisions. The criteria can be tested with configured values without setting launch policy.

## Epic 4: Settle the fare and pay the driver

Riders can reconcile a fare and payment, drivers can trace their earnings to a payout, and operations can resolve discrepancies.

### Story 4.1: Understand the final fare

As a rider, I want an itemized receipt so that I can reconcile the final fare with the quote I accepted. **Coverage:** FR7, FR10.

**Acceptance Criteria:**

- **Given** my trip is completed, **when** I open its receipt from trip history, **then** I see the accepted quote, each adjustment with its reason and amount, the final fare, currency, and current payment status.
- **Given** the pilot fare rules permit an adjustment, **when** the fare is calculated, **then** the receipt total equals the accepted fare plus the permitted adjustments. An adjustment outside those rules is excluded.

### Story 4.2: Pay once for a completed trip

As a rider, I want my payment status to be accurate even if the provider is slow or the app retries. **Coverage:** FR7, FR13.

**Acceptance Criteria:**

- **Given** a completed trip requires payment, **when** completion is delivered twice, **then** the provider receives a capture for the final fare using the rider’s payment token, and the rider is charged once.
- **Given** the provider response is lost, **when** the outcome is still unknown, **then** the rider sees **Payment pending** and the trip stays **Completed**. A later success callback updates the receipt to **Paid**. Replaying that callback produces only one capture entry in the ledger.
- **Given** the provider confirms a failed capture, **when** the rider opens the receipt, **then** it shows the failed payment and outstanding amount. Successful recovery clears that balance once and preserves the completed trip.
- **Given** an authorization hold exists and the trip ends without a charge, including **No driver found**, **when** settlement runs or retries, **then** the unused hold is released and no fare is captured.

### Story 4.3: Trace earnings from trip to payout

As a driver, I want to see how each trip contributes to my payout so that I can explain the amount I receive. **Coverage:** FR8, FR10.

**Acceptance Criteria:**

- **Given** I completed a trip, **when** I open it in my earnings history, **then** I see gross earnings, fees, signed adjustments, and net earnings. The displayed line items add up to the net amount.
- **Given** my earnings have been included in a payout, **when** I view that payout, **then** I can identify its included earnings, total, and current status. Earnings awaiting payout remain identifiable.
- **Given** I am signed in as a driver, **when** I request another driver’s earnings or payout details, **then** access is denied.

### Story 4.4: Receive a scheduled payout once

As a driver, I want my eligible earnings paid on the agreed cadence so that I can rely on the payout amount and status. **Coverage:** FR8.

**Acceptance Criteria:**

- **Given** eligible unpaid earnings reach their configured payout date, **when** the payout runs twice, **then** those earnings fund one transfer for their net total and appear under one payout in my history.
- **Given** the processor has yet to confirm the transfer, **when** I check its status, **then** I see that it is pending. A confirmed failure shows **Failed**. A confirmed success shows **Paid**.

### Story 4.5: Resolve a fare dispute with an audited refund

As an authorized operations agent, I want to issue an eligible refund so that I can resolve a rider’s dispute and account for the money returned. **Coverage:** FR11, FR13.

**Acceptance Criteria:**

- **Given** the charge is eligible and my role permits refunds, **when** I submit a refund with a reason, **then** the audit record identifies the agent, trip, amount, reason, and time. Repeating the submission cannot return the same money twice.
- **Given** the provider confirms the refund, **when** the rider reopens the receipt, **then** the refunded amount and payment status are visible and the trip still shows **Completed**.
- **Given** the refund is ineligible, my role lacks permission, or the reason is missing, **when** I submit it, **then** the console explains why it was blocked and the processor receives no refund instruction.

### Story 4.6: Reconcile processor records and investigate discrepancies

As an operations agent, I want to compare the ledger with processor records so that I can distinguish a failed transfer from one that succeeded but lost its confirmation. **Coverage:** FR8, NFR5.

**Acceptance Criteria:**

- **Given** a capture, refund, or payout differs in amount or status, or appears on only one side, **when** reconciliation runs, **then** operations receives an alert that identifies the transaction, the discrepancy, and the trip or payout it belongs to.
- **Given** the ledger shows a failed payout but the processor confirms it was paid, **when** I reconcile the records, **then** the payout status reflects the confirmed transfer and no second transfer is issued.
- **Given** a payout outcome remains unknown, **when** I open or repeat the investigation, **then** the discrepancy stays open and investigation alone cannot move money.

Capture and refund events use server timestamps and are deduplicated by event ID. Analytics exclude payment details. The processor, fare adjustment rules, refund permissions, payout cadence, and reconciliation owner remain open pilot decisions.

## Epic 5: Share a trip, give feedback, and get help

Riders can share temporary tracking access and give feedback. Trip participants can reach emergency calling and report problems, and authorized staff can respond to urgent reports and investigate exceptions.

### Story 5.1: Share an active trip with a trusted contact

As a rider, I want to share a temporary tracking link so that someone I choose can follow my trip. **Coverage:** FR9, NFR3.

**Acceptance Criteria:**

- **Given** my trip is active, **when** my contact opens its valid link, **then** they can see that trip’s current location and status. The link grants access only to the shared trip.
- **Given** the link has expired or the trip has ended, **when** my contact opens or refreshes it, **then** the page shows that tracking has ended and stops providing precise location updates.

### Story 5.2: Reach emergency calling during a trip

As a rider or driver, I want an emergency call action on the active trip so that I can reach help immediately. **Coverage:** FR9, NFR4.

**Acceptance Criteria:**

- **Given** I am viewing an active trip in either app, **when** I select the emergency call action, **then** the app opens the device’s calling interface with the emergency destination configured for the launch market. Filing a support report is optional.
- **Given** I use a screen reader, **when** I navigate the active-trip controls, **then** I can identify the emergency call action by its spoken label and activate it.

### Story 5.3: Review a past trip and rate it once

As a rider, I want to find the trip I took and rate it so that my feedback is attached to the right ride. **Coverage:** FR3, FR10.

**Acceptance Criteria:**

- **Given** I have past trips, **when** I select one from my history, **then** its details show its date, pickup, destination, final trip status, and receipt when available. Drivers can likewise open their own trip and earnings history.
- **Given** my trip is **Completed**, **when** I submit a rating and retry after losing the response, **then** exactly one rating is recorded for me on that trip.
- **Given** my first rating was accepted, **when** I reopen the same completed trip and submit a second rating as a new request, **then** the trip still has exactly one rating from me.
- **Given** I am a driver with past trips and my eligibility has ended through document expiry or suspension, **when** I open my history and select one of my trips, **then** I can read its details in either eligibility state.
- **Given** the trip ended as **Cancelled** or **No driver found**, **when** I open its details, **then** I can seek support and a rating submission is refused.

### Story 5.4: Report an incident or open a trip-linked case

As a trip participant, I want to report a problem from the trip itself so that support can identify the ride without asking me to reconstruct it. **Coverage:** FR3, FR9, FR10.

**Acceptance Criteria:**

- **Given** I am the rider or driver, **when** I submit an incident from the active trip or its history entry, **then** I receive confirmation and the report references the selected trip and my role.
- **Given** I have a billing question about a past ride, **when** I open a support case from that ride’s details, **then** the case is linked to that ride and is identifiable as a billing issue.
- **Given** my driver eligibility has ended through document expiry or suspension, **when** I open support from one of my past trips and submit an incident, **then** I receive confirmation for that trip in either eligibility state.
- **Given** I did not participate in a trip, **when** I attempt to open its details or file a case from them, **then** access is denied and its details stay private.

### Story 5.5: Route urgent reports to staffed responders

As a safety responder, I want urgent reports to reach my queue during service hours so that I can acknowledge them and operations can measure response time. **Coverage:** FR9, FR14.

**Acceptance Criteria:**

- **Given** an urgent report is submitted during pilot service hours, **when** escalation succeeds, **then** it appears in the staffed queue with the trip ID, report time, and escalation time. Retrying the escalation leaves one queue item for that report.
- **Given** the report is awaiting a response, **when** a responder first acknowledges it, **then** the system records the acknowledgment time and can calculate elapsed time from report to acknowledgment.
- **Given** an escalation event is recorded, **when** analytics processes it twice, **then** it counts once by event ID, uses the server timestamp, and excludes raw location and sensitive report contents.

### Story 5.6: Investigate a trip and audit an exceptional resolution

As an operations agent, I want to inspect a trip’s timeline so that I can explain what happened and resolve exceptions within my permissions. **Coverage:** FR11, FR12.

**Acceptance Criteria:**

- **Given** I have permission to investigate a trip, **when** I open its timeline, **then** I see recorded state changes in time order, including any reassignment, cancellation actor and reason, or early-end reason. Linked reports identify the trip they concern.
- **Given** my role permits a requested exception, **when** I apply it with a reason, **then** the audit record identifies me, the trip, the prior and resulting states, the reason, and the time.
- **Given** I have investigation-only access, **when** I attempt a state change, suspension, or refund from the case, **then** the action is denied and the trip, account, and balance retain their prior values.

Emergency routing, service hours, staffing, and the acknowledgment target remain launch decisions. The queue criteria apply during staffed hours.

## Epic 6: Operate the pilot by zone

Operations detects problems, pauses bookings without interrupting rides, and decides whether a zone is ready to expand.

### Story 6.1: Count each pilot event once

As a marketplace analyst, I want reliable trip events so that retries and rematches do not distort pilot results. **Coverage:** FR14, NFR3.

**Acceptance Criteria:**

- **Given** a test journey that includes a rematch, **when** I inspect its events, **then** each distinct offer and assignment has its own event ID and server timestamp. Replaying an event leaves its count unchanged.
- **Given** test journeys covering completion, cancellation, refund, and support escalation, **when** I check the event records, **then** I can trace quote display, confirmation, offer, assignment, arrival, start, completion, cancellation, capture, refund, and escalation to the corresponding journey.
- **Given** I inspect the analytics records, **when** I group them by service zone and hour, **then** both dimensions are available and the records exclude raw location, identity documents, and payment details.

### Story 6.2: Measure marketplace performance by zone and hour

As a marketplace lead, I want to know where riders go unmatched and how long pickups take so that I can decide where more driver coverage is needed. **Coverage:** FR14, PRD §6.

**Acceptance Criteria:**

- **Given** 100 confirmed requests, 90 assigned at least once, and 80 completed, **when** I review that zone and hour, **then** match rate is 90% and completion rate is 80%. Rematching a request leaves both denominators unchanged.
- **Given** seven of those 90 assigned requests had a driver-initiated pre-pickup cancellation, **when** I review driver cancellation rate, **then** it is 7/90, approximately 7.8%, even if some riders later completed their rides.
- **Given** completed trips have confirmation and recorded arrival times, **when** I review pickup performance, **then** I see the 90th percentile of that interval against the proposed 12-minute target. A zone-hour with zero eligible trips shows its sample size and an unavailable result.

### Story 6.3: Review payment, earnings, and safety outcomes

As a pilot lead, I want to see whether riders are billed successfully, drivers earn enough during online time, and urgent reports receive a response. **Coverage:** FR14, PRD §6.

**Acceptance Criteria:**

- **Given** 100 completed trips requiring payment have each had 24 hours to settle, **when** 98 were paid within their respective windows, **then** capture success is 98%. A later recovery does not retroactively count as payment within 24 hours.
- **Given** a driver earned 120 currency units net over six online hours, two of them idle, **when** I review earnings per online hour, **then** the result is 20. The comparison target uses the value agreed after driver interviews.
- **Given** urgent cases, known duplicate charges, and reconciliation discrepancies exist, **when** I review the pilot, **then** I can see acknowledgment times, cases still awaiting acknowledgment, known duplicate charges, and unresolved discrepancies by zone and hour.

### Story 6.4: Detect and investigate operating failures

As an operations agent, I want an alert identifying the failing part of the trip so that I can investigate while the issue is active. **Coverage:** NFR5.

**Acceptance Criteria:**

- **Given** an agreed alert condition is met for dispatch failures, stale location spikes, delayed payment callbacks, or reconciliation discrepancies, **when** monitoring evaluates it, **then** operations receives an alert identifying the condition, affected period, and available trip or transaction references.
- **Given** I have investigation permission, **when** I follow an affected trip ID, **then** I can open its timeline. Alert payloads exclude precise coordinates, identity documents, and payment details.

### Story 6.5: Pause bookings while active trips finish

As an operations agent, I want to pause one service zone so that I can contain an issue while drivers finish trips already underway. **Coverage:** FR15, NFR1.

**Acceptance Criteria:**

- **Given** bookings are paused in one zone, **when** a rider confirms a new request there, including from a quote issued before the pause, **then** the app explains the pause and creates no request. An open zone continues to accept eligible bookings.
- **Given** a trip was already in progress in the paused zone, **when** either participant reconnects, **then** the app restores the trip and the driver can complete it. A completion retry records one completion.
- **Given** operations reopens the zone, **when** a rider confirms a valid quote, **then** the normal booking flow resumes.

### Story 6.6: Decide whether to open or expand the pilot

As a release owner, I want field evidence and agreed thresholds so that I can explain the decision to open a zone or hold expansion. **Coverage:** NFR4, PRD §§7–8.

**Acceptance Criteria:**

- **Given** an internal field test on supported iOS and Android devices, **when** the team reviews readiness, **then** it has recorded results for the full trip lifecycle, denied location permission, weak connectivity, concurrent acceptance, rematching, failed capture, duplicate callbacks, refunds, and payout reconciliation. Results include the proposed quote, location-update, and stale-location targets.
- **Given** location permission is denied and the screen reader and enlarged text are enabled on a supported iOS or Android device, **when** a signed-in rider enters both addresses, reviews the pickup ETA and fare, and confirms the quote using accessible controls, **then** one request is created, the resulting booking status is announced and readable, and the tester records the result on each platform.
- **Given** a zone is proposed for the closed pilot, **when** operations reviews it, **then** the review records verified driver supply, invited-rider access, service hours, staffed support, and rehearsal results for incident handling, booking pause, and active-trip recovery. Market sign-offs and the retention agreement are recorded before launch.
- **Given** expansion is under review, **when** the release owner assesses the evidence, **then** approval requires at least two consecutive pilot weeks meeting agreed targets, the minimum trip volume agreed before pilot start, zero known duplicate charges or unresolved reconciliation gaps, and zero unresolved release-blocking safety or money-movement defects. The review identifies any unmet condition.

The rates in Stories 6.2 and 6.3 are test examples. The PRD’s proposed thresholds remain subject to pilot agreement.
