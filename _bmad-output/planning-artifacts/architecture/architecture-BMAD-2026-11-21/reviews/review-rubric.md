# Architecture Spine Review

**Artifact:** [`ARCHITECTURE-SPINE.md`](../ARCHITECTURE-SPINE.md)  
**Review date:** 2026-11-21  
**Method:** `bmad-architecture/references/reviewer-gate.md` good-spine checklist; input coverage check against the cited PRD, epics and UX documents; official-source checks for named technology versions.  
**Verdict:** **Revise before treating this as a build contract.** The core transaction and module-ownership decisions are useful, but several cross-epic contracts remain underspecified. One toolchain pin is below the documented minimum, and payout, authorization and location-ordering rules need to be made buildable.

## Mechanical gate

`lint_spine.py` passed: **0 findings**. It was run with a temporary cache directory after the default cache location was blocked by the workspace sandbox. This checks the script's mechanical rules; it does not establish semantic completeness.

## Findings

### High

#### H1 — Node minimum conflicts with the selected Expo SDK

**Location:** Stack, lines 101–105.  
**Finding:** Expo's SDK 58 reference pairs SDK 58 with React Native 0.88 and specifies Node **22.13.x minimum**. The spine specifies `Node.js 22.12+`, which permits a runtime Expo 58 does not document as supported. This can yield inconsistent local/CI builds or an unsupported scaffold. NestJS 12 itself accepts Node 22.12+, but the combined stack must satisfy Expo's stricter floor.  
**Recommended disposition:** Autofix the Node constraint to the verified Expo/Nest compatible floor, or use an explicit current Active LTS range if the chosen scaffold supports it. Recheck the Expo matrix at scaffold and keep its React Native pairing intact.  
**Official sources:** [Expo SDK reference](https://docs.expo.dev/versions/latest/) · [NestJS first steps](https://docs.nestjs.com/first-steps)

#### H2 — Driver payout has no durable ownership or safe-retry rule

**Location:** AD-2 and AD-7, lines 34–38 and 64–68; capability map, lines 144–153.  
**Finding:** The PRD requires earnings, payouts, processor reconciliation and investigation without issuing a transfer twice (FR8). AD-2 governs only ride capture; AD-7 lists payment authorizations, captures, refunds and ledger, but omits payout/transfer ownership. The system context names payment providers but does not establish durable payout intents, idempotent provider operations, unknown-outcome reconciliation, ledger linkage, or who may initiate/retry a payout. A story implementer could independently invent incompatible transfer state and retry behavior.  
**Recommended disposition:** Add a payment/payout invariant or explicitly bind payout work to a future decision with a gate before the payout stories. Define durable transfer intent, stable operation identity, unknown-outcome reconciliation before retry, deduplication and ledger/reconciliation ownership. Map R08/FR8 to it.

#### H3 — Location ordering has no authoritative sequence source

**Location:** AD-4 and Consistency Conventions, lines 46–50 and 89–95.  
**Finding:** “Accept only newer samples” and “duplicate or older” do not say how freshness/order is determined. Server timestamps are listed as UTC, but driver device clocks can skew or move; using device capture time could reject valid samples or allow stale positions to replace current ones. The rule also lacks a defined assignment/session sequence boundary for a driver reconnecting or changing assignments.  
**Recommended disposition:** Specify a monotonic per-driver or per-assignment sequence/version (or another authoritative ordering token) and define the active-assignment fence. Keep capture time separately for display/latency if needed; do not use client wall-clock time as the acceptance order.

#### H4 — Shared API contract is named but has no source of truth

**Location:** AD-6 and Consistency Conventions, lines 58–62 and 91–95.  
**Finding:** Rider app, driver app and console are separately built clients. The spine requires “typed API contracts” and versioning but leaves endpoint shapes deferred without fixing how the contract is authored, checked or consumed. Independent teams could produce incompatible schemas, enum/state names, error behavior or idempotency semantics while satisfying the wording.  
**Recommended disposition:** Fix a single contract source and compatibility rule (for example, an API schema generated/validated in CI and shared client types, or an equivalent typed contract mechanism). Keep concrete endpoints and payload details deferred.

### Medium

#### M1 — Payment authorization and release are not governed

**Location:** AD-2 and capability map, lines 34–38 and 144–153.  
**Finding:** FR7 requires authorization before dispatch where supported, release of unused holds when a trip ends without charge, and distinct payment state from trip state. AD-2 only governs completion/capture. The spine does not define when authorization is a dispatch precondition, who owns auth/void/release, or how uncertain authorization and release outcomes are reconciled. This leaves a money-movement seam independent builders may implement differently.  
**Recommended disposition:** Add the authorization/release lifecycle to the Payments ownership and durable work rules, while leaving provider-specific behavior conditional as the PRD does.

#### M2 — Authentication, identity and webhook trust boundaries are absent

**Location:** Design Paradigm, AD-7/AD-8, system context and deployment, lines 22–24, 64–74, 110–129.  
**Finding:** Role checks are required, but there is no owner or contract for rider/driver/agent identity, session authentication, account-to-role binding, or service-to-service identity. Payment callbacks and other provider ingress are shown as integrations without an explicit verification boundary. This matters because several rules depend on an “authorized actor,” and operations can change account access or money.  
**Recommended disposition:** State the ownership and enforcement boundary for authentication/role claims and provider callbacks. Provider and identity vendors can remain deferred; define verification and authorization responsibilities in the backend.

#### M3 — Operational recovery and observability requirements are only partially mapped

**Location:** AD-5, deployment and environments, capability map, lines 52–56, 127–129 and 144–153.  
**Finding:** The PRD calls for alerts on dispatch failures, stale-location spikes, delayed callbacks and reconciliation discrepancies, and says active trips must remain recoverable during a booking pause. The spine selects managed hosting and reporting views but does not assign ownership for alert signals/runbooks, backup/restore or recovery objectives, worker retry/dead-letter handling, or the zone pause control. There is not enough operational contract for teams to deliver these consistently.  
**Recommended disposition:** Add an operational seed/invariant at the level needed for the pilot: alert/event ownership, worker recovery/replay behavior, database backup/restore responsibility, and zone pause semantics. Provider-specific topology may stay deferred.

#### M4 — The capability map omits meaningful PRD and UX capabilities

**Location:** Capability → Architecture Map, lines 144–153.  
**Finding:** The map covers the broad domains but omits explicit ownership for quote expiry and fare calculation, phone sign-in, masked contact, pickup PIN and override auditing, ratings/feedback, trip sharing links, support cases, refunds and payout reconciliation, and no-booking zone controls. Some appear in stories or module labels, but several have no clear module owner or governing invariant. Since this is feature altitude, the map should account for every capability in its input documents, even where the answer is simply “deferred.”  
**Recommended disposition:** Complete the map by grouping these under clear owners and binding rules, or call out policy/provider decisions as deferred. Do not add low-level schema or endpoint detail.

#### M5 — Idempotency replay rules do not define key reuse or retention

**Location:** AD-2, AD-3 and Consistency Conventions, lines 34–44 and 91–95.  
**Finding:** The rules correctly scope replays to an actor/resource and persist command outcomes, but do not say what happens when the same key is reused with a different request body, nor how long command/payment operation records remain replayable. A client or provider retry after retention expiry could be treated as a fresh command or financial operation.  
**Recommended disposition:** Specify request fingerprint mismatch behavior and a retention/reconciliation policy sufficient for the maximum client retry and provider settlement window. Preserve the stable provider operation identity beyond ordinary request-cache TTL.

#### M6 — Security/privacy rule leaves important handling controls implicit

**Location:** AD-8 and deployment, lines 70–74 and 127–129.  
**Finding:** AD-8 sets useful analytics and access restrictions, but “encrypted object storage” does not settle access URL lifetime/authorization, encryption-key responsibility, document download auditing, retention/deletion or location retention. The PRD explicitly requires market-specific retention to be agreed before launch. These controls can affect how independently built upload/review and operations flows store and expose sensitive evidence.  
**Recommended disposition:** Add the invariant-level controls (server-authorized short-lived document access, audited reads/actions, retention/deletion owner and key-management responsibility) or make each a launch-blocking open decision with an owner. The city-specific retention period can remain deferred.

#### M7 — Version pins need a deliberate current-runtime decision

**Location:** Stack, lines 97–106; Deferred, lines 155–162.  
**Finding:** Expo 58/React Native 0.88 are a verified compatible pair. NestJS 12 is real and its documented runtime floor is compatible with the Expo floor once Node is raised. PostgreSQL 18.7 is a valid supported release, but PostgreSQL 19.0 was released on 2026-11-19, two days before this spine; the spine does not say whether 18.7 is a deliberate conservative-major choice or an unnoticed stale pin. “Current compatible stable release at scaffold” is also not an enforceable TypeScript version decision, and deferring only its patch number leaves the major/minor range unclear.  
**Recommended disposition:** Record the deliberate PostgreSQL major choice (18 supported branch versus newly released 19) and state the TypeScript compatibility range/authority. Exact patch numbers can remain scaffold-owned.  
**Official sources:** [PostgreSQL release notes](https://www.postgresql.org/docs/release/) · [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/) · [Expo SDK 58 compatibility table](https://docs.expo.dev/versions/v58.0.0/) · [React Native releases](https://reactnative.dev/releases/overview) · [NestJS v12 releases](https://github.com/nestjs/nest/releases)

## Strengths to preserve

- AD-1 captures the central dispatch race and makes the winning assignment independent of client clocks.
- AD-2 correctly couples trip completion with durable capture work and treats unknown provider outcome as reconciliation work, not an immediate blind retry.
- AD-3 gives trip commands optimistic concurrency, replay behavior and atomic outcome recording.
- AD-5/AD-7 make a reasonable pilot-scale modular-monolith and domain-state ownership commitment.
- The spine includes the deployment/environment dimension and explicitly defers provider and market choices rather than pretending they are settled.
- The 30-second stale-location rule aligns with the PRD and UX specifications.

## Official-source verification notes

- **Expo SDK 58 / React Native 0.88:** confirmed as the official SDK pairing. Expo's current version table sets Node 22.13.x as the minimum; this conflicts with the spine's 22.12+ floor. [Expo SDK reference](https://docs.expo.dev/versions/latest/)
- **NestJS 12:** confirmed on the official release repository. NestJS docs specify Node 20.19+ or 22.12+ for the framework, and higher floors for CLI generators. [NestJS releases](https://github.com/nestjs/nest/releases) · [NestJS prerequisites](https://docs.nestjs.com/first-steps)
- **PostgreSQL 18.7:** confirmed as a current supported minor of the 18 branch. PostgreSQL 19.0 was released on 2026-11-19, so 18.7 remains supported but is no longer the newest major. [Release archive](https://www.postgresql.org/docs/release/) · [Versioning policy](https://www.postgresql.org/support/versioning/)
- **TypeScript:** not pinned to a concrete version or compatibility range in the spine; it cannot be confirmed as an enforceable stack decision from the document alone.

## Suggested resolution order

1. Correct the Node floor and state how the scaffold pins compatible Expo-managed native packages.
2. Define payment authorization, payout and reconciliation as a single coherent money-movement contract.
3. Make API contract ownership and location sample ordering authoritative and implementable.
4. Add authentication/provider ingress and operational recovery/alert ownership.
5. Complete capability coverage and mark genuine policy/provider decisions deferred with their launch gates.
