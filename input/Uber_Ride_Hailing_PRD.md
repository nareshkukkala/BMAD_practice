# Uber-Style Ride-Hailing · Product Requirements Document

| Field | Value |
| --- | --- |
| Version | 0.1 |
| Status | Draft for review |
| Date | 21 November 2026 |
| Product surfaces | Rider app, driver app, operations console |
| Launch assumption | One city, defined service zones, one economy car category |

## 1. Problem and objective

Riders need to know whether a ride is available, how much it will cost, and when it will arrive. Drivers need reliable trip offers, clear pickup instructions, and transparent earnings. Operations teams need enough visibility to resolve failed matches, payment disputes, and safety reports.

The MVP should prove that a local marketplace can repeatedly match riders with eligible drivers and complete trips with predictable pickup times, accurate billing, and manageable support demand.

## 2. Users and scope

| User | Primary job |
| --- | --- |
| Rider | Book an immediate ride, find the driver, track the trip, and pay |
| Driver | Go online, accept a trip, pick up the right rider, and see earnings |
| Operations agent | Approve drivers, investigate trip issues, and resolve exceptions within assigned permissions |

**In scope:** On-demand point-to-point rides, one digital payment method, upfront quotes, driver verification, dispatch, live tracking, pickup verification, receipts, ratings, support, trip sharing, and driver payouts.

**Deferred:** Scheduled and shared rides, multi-stop itineraries, cash, subscriptions, promotions, airport-specific flows, and dynamic pricing. Pilot service hours, the city, and supported languages are launch decisions.

## 3. Trip lifecycle

A quote expires at a displayed time. Confirming a valid quote creates a trip request. The normal trip states are **Searching → Assigned → Driver arrived → In progress → Completed**. Searching can end as **No driver found** or **Cancelled**. An assigned trip can return to Searching if the driver cancels before pickup and the rider still wants the ride. Assigned and Driver arrived can also end as Cancelled. Once in progress, early drop-off uses trip completion with an explicit early-end reason. Operations can handle exceptional outcomes through an audited workflow.

Payment state is independent of trip state. A completed trip remains completed even if a charge is pending, failed, or refunded.

## 4. Functional requirements and acceptance criteria

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| R01 | Rider sign-in and location selection | Rider can verify a phone number, search for addresses, and adjust pickup on a map. With location permission denied, manual address entry remains available. Booking is blocked for unsupported pickup or drop-off points with a clear reason. |
| R02 | Quote and confirmation | Show pickup ETA estimate, fare breakdown, currency, and quote expiry before confirmation. Expired quotes require the rider to accept a fresh price. Repeated taps or network retries return the same request. |
| R03 | Driver onboarding and availability | Drivers submit identity, vehicle, and market-required documents. Only approved drivers with valid documents can go online. Expiry or suspension blocks new offers while preserving access to trip history and support. |
| R04 | Dispatch and reassignment | Rank eligible nearby drivers using pickup ETA and current availability. Offers expire. Concurrent acceptances produce exactly one assigned driver, and each driver can hold at most one active assignment. If dispatch times out, show No driver found and offer a retry. |
| R05 | Pickup and live trip | Show driver name, photo, vehicle plate, and ETA after assignment. Provide masked contact and navigation to pickup. Require a pickup PIN to start, with audited support handling for exceptions. Mark outdated location with a last-updated time. Reopening either app restores the authoritative trip state. |
| R06 | Cancellations and no-shows | Show any applicable charge before rider confirmation. Record the actor, reason, and timestamp. Driver cancellation before pickup has no rider fee and can trigger rematching. No-show requires recorded arrival and the configured grace period. |
| R07 | Fare and payment | Authorize payment before dispatch where supported by the chosen provider, then capture once on completion. Display the final fare and itemize any permitted adjustments. Release unused holds when a trip ends without a charge. Duplicate payment callbacks cannot create duplicate ledger entries. Failed capture creates a recoverable balance and gives the rider clear payment status. |
| R08 | Earnings and payouts | Drivers can see completed trip earnings, fees, adjustments, and payout status. Operations reconciles processor records against the ledger and can investigate a failed payout without issuing it twice. |
| R09 | Safety and support | Riders can share an expiring trip-tracking link. Riders and drivers can report an incident from the active trip or trip history. The app provides an emergency call entry point. Urgent reports enter a staffed escalation queue during service hours. |
| R10 | Trip history and feedback | Riders can open trip details and receipts, submit one rating per completed trip, and open a trip-linked support case. Drivers can review their own trip and earnings history. |
| R11 | Operations console | Authorized agents can view trip timelines, review driver documents, suspend drivers, and initiate eligible refunds. Actions that change account access or money require role checks, a reason, and an audit record. |

## 5. Reliability, privacy, and accessibility

- **Recovery:** Make booking, assignment, trip transitions, and money movement safe to retry. After a dropped connection, reload server state before applying conflicting updates. Keep active trips recoverable when new booking is paused.
- **Performance:** Proposed pilot targets are p95 quote response within 3 seconds and active-trip location updates visible within 10 seconds under normal connectivity. Mark location stale after 30 seconds. Validate all three in field tests.
- **Data protection:** Limit precise location sharing to active trip use cases, enforce access by role, encrypt sensitive data, and keep raw location, identity documents, and payment details out of analytics. Use payment provider tokens and agree on market-specific retention before launch.
- **Accessibility:** Support screen readers, scalable text, and text descriptions for pickup, ETA, price, and status. Ensure the full booking flow can be completed using address entry and accessible controls.
- **Observability:** Alert operators to dispatch failures, stale location spikes, payment callback delays, and reconciliation discrepancies. Track incidents by trip ID without exposing sensitive data.

## 6. Pilot success measures

Targets are proposed planning thresholds for the pilot. Review them by service zone and hour before expanding.

| Metric | Definition | Proposed threshold |
| --- | --- | --- |
| Trip completion rate | Completed trips ÷ confirmed requests, including unfulfilled and cancelled requests | ≥ 80% |
| Match rate | Requests assigned at least once ÷ confirmed requests | ≥ 90% |
| Pickup time | Rider confirmation to recorded driver arrival, for completed trips | p90 ≤ 12 min |
| Driver cancellation rate | Requests with a driver-initiated pre-pickup cancellation ÷ requests assigned at least once | ≤ 8% |
| Payment capture success | Paid completed trips within 24 hours ÷ completed trips requiring payment | ≥ 98% |
| Driver earnings per online hour | Net marketplace earnings ÷ online hours, including idle time | Set after driver onboarding interviews |
| Safety response and billing | Urgent case acknowledgment time, duplicate charges, and unresolved reconciliation gaps | Agree on response SLA before launch. Zero known duplicate charges or unresolved reconciliation gaps at expansion review. |

Record events for quote display, booking confirmation, driver offer, assignment, arrival, start, completion, cancellation, capture, refund, and support escalation. Use server timestamps and deduplicate by event ID.

## 7. Rollout and release criteria

1. **Internal field test.** Verify the full lifecycle on supported iOS and Android devices. Include denied location permissions, weak connectivity, concurrent driver acceptance, rematching, failed capture, duplicate callbacks, refunds, and payout reconciliation.
2. **Closed pilot.** Launch in limited zones and hours with invited riders and verified drivers. Confirm supply coverage before opening each zone. Staff support and rehearse incident handling, booking pause, and active-trip recovery.
3. **Controlled expansion.** Expand after at least two consecutive pilot weeks meeting agreed targets, with sufficient trip volume agreed before pilot start and no unresolved release-blocking safety or money-movement defects. Operations can pause new requests by zone while allowing active trips to finish.

## 8. Risks and decisions

| Risk or decision | Proposed handling | Owner |
| --- | --- | --- |
| Thin driver supply | Limit service zones and hours, then monitor failed matches and earnings by zone | Marketplace |
| Inaccurate pickup and GPS drift | Use editable pins, pickup notes, stale-state indicators, and field tests | Product and Engineering |
| Fare disputes | Define quote guarantees, adjustment rules, cancellation fees, and grace periods before pilot | Product and Operations |
| Payments and driver earnings | Select a processor and finalize refund permissions, payout cadence, and reconciliation ownership | Finance and Engineering |
| Local operating obligations | Confirm launch market and obtain sign-off on operating permissions, insurance, driver checks, and privacy requirements | Legal and Operations |
| Safety coverage | Agree on emergency routing, response SLA, and support staffing before opening bookings | Trust and Safety |
