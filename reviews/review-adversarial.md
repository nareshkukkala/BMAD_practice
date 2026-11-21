# Adversarial review: architecture spine

**Verdict: FAIL — downstream units can follow the stated rules and still choose incompatible owners, sources of truth, or mutation boundaries.**

Scope: `ARCHITECTURE-SPINE.md`, reviewed as a build substrate for independently implemented stories. The counterexamples below are deliberately compliant with the spine as written; they show where its rules do not select one implementation contract.

## Findings

### 1. Driver availability has no declared owner or canonical representation

**Location:** AD-1, AD-7, Domain ownership, and Capability → Architecture Map

**Trigger condition:** A story needs to claim an offer for a driver that is eligible and available. AD-1 requires Dispatch to validate availability and atomically claim the trip and driver. AD-7 gives Eligibility approval/suspension and Dispatch offers/assignment, but assigns no owner to online/available status, its transitions, or the authoritative representation Dispatch must validate.

**Two compliant downstream units:**

1. **Offer acceptance unit:** Eligibility owns only approval/suspension. Dispatch owns and mutates `driver_availability` (online, available, busy), and checks that row with the assignment in its claim transaction.
2. **Driver presence unit:** A Presence/Trips capability owns online/available state and emits typed status events. Dispatch keeps a read projection and checks that projection while atomically claiming assignment. The spine permits the module boundary and the projection because it does not assign availability ownership or require a synchronous owner read.

Both implement an atomic Dispatch claim and leave eligibility approval/suspension with Eligibility, yet disagree on who can mutate availability, which table is canonical, and whether a just-changed status is visible to a claim. A driver can be assigned after going offline, or one implementation can reject an offer another accepts.

**Guard to add:** Assign online/available state to one named module; define its states and allowed writers; state how Dispatch obtains a claim-time value (for example, a synchronous read in the claim transaction or a versioned projection with a specified freshness/claim rule). Define when assignment changes availability and how release restores it.

### 2. Completion and capture work have a shared transaction but no mutation owner

**Location:** AD-2, AD-5, AD-7, and Domain ownership

**Trigger condition:** A completion story must atomically persist `Completed` and one durable capture request. AD-2 fixes the transaction boundary but does not say which module initiates/co-ordinates it or how Payments may create its owned work record while Trips owns lifecycle state.

**Two compliant downstream units:**

1. **Complete-trip unit:** Trips handles the command, opens the PostgreSQL transaction, mutates its trip row, and calls a Payments command handler in the same unit of work to insert the capture request.
2. **Capture-scheduling unit:** Payments handles a `CompleteTripAndScheduleCapture` orchestration command, invokes a Trips-owned transition operation and inserts its own durable request in the shared transaction. The transaction coordinator is in the Payments application layer.

Both leave lifecycle and payment state nominally owned by their named modules, use typed commands, and satisfy the atomic durability rule. Yet they establish different public mutation paths, transaction ownership, and module dependency direction. A third implementation could reject the second as a forbidden cross-module write, leaving teams unable to tell which compliant seam to build.

**Guard to add:** Name the command owner/orchestrator and the sole transaction entry point. Specify that each module mutates only its own records through a transaction-scoped module operation, and define the exact command/result contract that inserts the capture request atomically with the Trips transition.

### 3. “Newer” location samples do not have a defined ordering key

**Location:** AD-4 and Consistency Conventions

**Trigger condition:** A driver reconnects and submits buffered GPS samples alongside current samples. AD-4 says to accept only “newer” samples and not trust the client clock for ordering, but gives no server-issued sequence, monotonic sample counter, receive-time rule, or tie-breaker. It also leaves the latest-position record’s owner and mutation API implicit.

**Two compliant downstream units:**

1. **Location ingestion unit:** Driver sends a monotonically increasing per-assignment sequence; the backend accepts only a greater sequence and stores that sequence with the latest point.
2. **Trip update unit:** The backend timestamps arrivals and accepts a sample when its server receive timestamp is later than the stored timestamp; it stores a latest-location value alongside trip data, with GPS updates excluded from trip-version increments.

Both reject duplicates/older samples under their chosen definition, keep location independent of trip version, and could be implemented from AD-4. They produce different current locations for delayed/out-of-order packets, have different persistence ownership, and may disagree on whether a buffered point refreshes the 30-second staleness timer.

**Guard to add:** Assign location state and its mutation API to a named module. Define a server-verifiable ordering token scoped to the active assignment, equal-token behavior, whether buffered points are eligible, and exactly which accepted timestamp drives staleness.

## Review summary

The spine already names several domain owners and strong concurrency invariants, but its current ownership boundary is not operationally complete at module interfaces. The counterexamples do not require violating the text: they exploit unspecified ownership for availability and location, and an unspecified transaction coordinator for the cross-module completion/capture mutation. These gaps are likely to yield incompatible stories and tests before a schema is chosen.
