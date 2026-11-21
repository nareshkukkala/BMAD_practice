# Epic 1 Context: Get approved to drive

## Goal

Drivers can submit market-required identity and vehicle documents, receive an eligibility decision, and go online only while approved and compliant. Operations agents can review applications and suspend eligibility with an auditable reason. A driver whose eligibility lapses retains access to their own trip history and support.

## Stories

- Story 1.1: Submit driver documents
- Story 1.2: Review and approve a driver
- Story 1.3: Go online when eligible
- Story 1.4: Suspend eligibility for new offers

## Requirements & Constraints

- Require identity, vehicle, and market-required documents before review. The launch market and exact checklist remain undecided.
- Only approved drivers with valid documents may go online or receive offers. Expiry and suspension block new offers.
- Preserve driver access to personal trip history and support after expiry or suspension.
- Encrypt identity documents. Exclude identity document contents, raw locations, and payment details from analytics.
- Document viewing and eligibility-changing actions require role-based access. Approval and suspension record the agent, reason, and server time.
- Deny unauthorized document access, approval, or suspension without changing eligibility.
- Record pilot events with server timestamps and deduplicate by event ID.
- The design calls for an onboarding checklist with per-document status and a clear next action. Handle large text, screen readers, and document expiry dates accessibly.

## Technical Decisions

- Approved deployment decisions in the architecture memlog: one modular backend and transactional database; API and background worker are independently runnable processes from the same codebase.
- The mobile framework, backend language, storage provider, hosting environment, and upload size/type policy are not yet decided.
- No architecture implementation spine has been finalized. The architecture memlog records AD-1 through AD-5, including dispatch, payment capture, versioned trip actions, location updates and deployment model.

## UX & Interaction Patterns

- Driver onboarding is a document checklist showing status and the next action. Approved, in-review, rejected-with-reason, and expiry states are represented in the supplied strategy.
- The driver home shows eligibility and why going online is unavailable.
- Expired or suspended drivers can still reach history and support.
- See the UX DESIGN.md and EXPERIENCE.md contracts for shared design tokens, responsive behavior and accessibility rules.

## Cross-Story Dependencies

- Story 1.1 submission feeds Story 1.2 review.
- Story 1.2 approval enables Story 1.3 availability.
- Story 1.4 suspension and document expiry must be enforced by the eligibility check used by later dispatch stories.
- Driver history and support arrive in later epics. Epic 1 must preserve their access-control path when eligibility is restricted.

