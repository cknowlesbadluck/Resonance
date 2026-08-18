# Resonance Execution Fabric Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the provider-neutral execution fabric so an execution has deterministic identity, safe idempotent initiation, durable lifecycle events, coherent terminal states, retry/replay semantics, and first-class evidence without changing Resonance's core identity.

**Architecture:** Extend the existing Nexus execution contracts rather than replacing them. Execution identity and idempotency remain core semantics; durable persistence is an adapter-backed concern. Lifecycle events flow through the executor event sink, while evidence is correlated to executions and remains provider-neutral.

**Tech Stack:** TypeScript, Next.js, existing Nexus domain/runtime, Vitest/Jest-compatible project test runner, Supabase migrations/RLS where persistence changes are required.

**Spec:** `README.md` Nexus architecture and `docs/ROADMAP.md` Phase 4 execution-fabric requirements, as validated by `docs/NEXUS_PROOF.md` and the approved 2026-08-18 execution-fabric design.

## Global Constraints

- Resonance remains provider-neutral; no provider becomes a core domain primitive.
- MCP remains one adapter mechanism, not the product boundary.
- Chambers remain one execution mechanism, not the product boundary.
- Quicksilver remains a separate project and must not become a Resonance core dependency.
- No Twilio or Vercel references are introduced.
- No critical reformation, irreversible migration, major subsystem replacement, or vendor lock-in is permitted by this plan.
- Existing working contracts are extended additively where possible.
- Tests must cover deterministic behavior, idempotency, lifecycle transitions, retry/replay, and evidence correlation.
- Provider secrets must never be committed.

---

## File Map

- `src/nexus/` — existing Nexus contracts and runtime; extend execution and evidence semantics here.
- `supabase/` — persistence migrations/RLS only if current execution storage requires schema changes.
- `docs/NEXUS_PROOF.md` — update the proof when the durable lifecycle/evidence path is demonstrably covered.
- `docs/ROADMAP.md` — mark only execution-fabric items actually verified complete.
- `docs/superpowers/plans/2026-08-18-resonance-execution-fabric.md` — this implementation plan.

Before implementation, locate the exact existing execution, lifecycle-event, persistence, and test files under `src/nexus/` and `supabase/`; preserve their established naming conventions rather than creating parallel abstractions.

---

### Task 1: Lock the execution lifecycle contract with tests

**Files:**
- Inspect/Modify: existing execution contract files under `src/nexus/`
- Inspect/Modify: existing execution tests under `src/nexus/`

**Interfaces:**
- Consumes: current execution request, execution result, lifecycle event, executor, and idempotency contracts.
- Produces: one explicit lifecycle state model and transition rules used by later tasks.

- [ ] **Step 1: Write failing tests for legal lifecycle transitions**

Cover at minimum: initiated → running → succeeded; initiated → running → failed; initiated → waiting-for-approval; waiting-for-approval → running; and rejection/cancellation terminal behavior if those states already exist in the repository.

- [ ] **Step 2: Run the focused test suite and verify the tests expose the current ambiguity**

Run the repository's existing test command for the affected Nexus execution tests. Expected result: the new tests fail only where the current lifecycle contract is insufficient.

- [ ] **Step 3: Define the minimal explicit lifecycle state/transition contract**

Use the repository's existing event/status names where present. Reject impossible transitions deterministically rather than silently coercing them.

- [ ] **Step 4: Run focused tests**

Expected: all lifecycle transition tests pass.

- [ ] **Step 5: Commit**

Commit message: `test: lock execution lifecycle semantics`

---

### Task 2: Harden deterministic execution identity and idempotent initiation

**Files:**
- Inspect/Modify: existing deterministic request hashing and execution initiation files under `src/nexus/`
- Inspect/Modify: existing idempotency tests
- Modify: relevant Supabase migration only if the current schema needs a uniqueness constraint or atomic claim primitive

**Interfaces:**
- Consumes: existing deterministic request hashing and idempotency-key implementation.
- Produces: deterministic execution identity and atomic initiation semantics that later lifecycle/evidence code can trust.

- [ ] **Step 1: Add failing tests for equivalent requests**

Verify equivalent execution requests produce the same deterministic identity regardless of object-key insertion order, while materially different inputs produce different identities.

- [ ] **Step 2: Add failing tests for concurrent duplicate initiation**

Verify two initiations using the same idempotency identity yield one claimed execution and a deterministic duplicate response rather than two executions.

- [ ] **Step 3: Run focused idempotency tests**

Expected: failures identify any remaining nondeterminism or non-atomic duplicate path.

- [ ] **Step 4: Implement the minimal deterministic/atomic behavior**

Reuse the existing hashing and atomic-claim work already present in the repository; do not create a second idempotency subsystem.

- [ ] **Step 5: Run focused tests and the full typecheck**

Expected: all affected tests and typecheck pass.

- [ ] **Step 6: Commit**

Commit message: `fix: harden execution idempotency semantics`

---

### Task 3: Complete durable lifecycle event emission

**Files:**
- Inspect/Modify: existing executor lifecycle event sink files under `src/nexus/`
- Inspect/Modify: lifecycle event persistence adapter
- Inspect/Modify: event/lifecycle tests
- Modify: Supabase migration only if the current durable event schema is incomplete

**Interfaces:**
- Consumes: explicit lifecycle state model and idempotent execution identity.
- Produces: exactly-once-at-the-persistence-boundary lifecycle records suitable for audit/evidence correlation, using the existing executor event sink.

- [ ] **Step 1: Write failing tests for lifecycle event ordering**

Verify initiation, running, terminal, and approval-related events are emitted through the centralized sink rather than scattered direct writes.

- [ ] **Step 2: Write failing tests for duplicate event suppression where the existing schema supports an event identity**

Verify retrying the same lifecycle emission cannot create conflicting duplicate records.

- [ ] **Step 3: Run focused lifecycle-event tests**

Expected: tests fail only on missing guarantees.

- [ ] **Step 4: Implement centralized durable emission**

Use the executor sink already introduced by the latest commits. Preserve event correlation to the execution identity and request identity.

- [ ] **Step 5: Run focused tests and typecheck**

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: harden durable execution lifecycle events`

---

### Task 4: Add retry and replay semantics without duplicate execution

**Files:**
- Inspect/Modify: existing executor/runtime files under `src/nexus/`
- Inspect/Modify: execution/idempotency tests
- Inspect/Modify: lifecycle event tests

**Interfaces:**
- Consumes: deterministic execution identity, idempotent initiation, durable lifecycle events.
- Produces: explicit retry/replay behavior with stable correlation and no accidental duplicate logical execution.

- [ ] **Step 1: Write failing tests for retry of a failed execution**

Verify retry creates or resumes the repository's intended execution representation according to existing semantics, records the retry relationship, and never loses the original evidence.

- [ ] **Step 2: Write failing tests for replay/idempotent resubmission**

Verify resubmitting an already terminal idempotent request does not silently execute it twice.

- [ ] **Step 3: Run focused retry/replay tests**

Expected: failures expose missing state/relationship semantics.

- [ ] **Step 4: Implement minimal retry/replay semantics**

Do not introduce a workflow engine. Keep retry/replay at the execution-fabric boundary and make all behavior observable through lifecycle events.

- [ ] **Step 5: Run focused tests plus the full test suite**

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add execution retry and replay semantics`

---

### Task 5: Make evidence first-class and correlated

**Files:**
- Inspect/Modify: existing event/evidence/artifact contracts under `src/nexus/`
- Inspect/Modify: persistence adapter/schema for evidence
- Inspect/Modify: evidence tests

**Interfaces:**
- Consumes: execution IDs, lifecycle events, adapter outputs, and artifact references.
- Produces: provider-neutral evidence records with execution correlation, provenance, timestamps, and durable artifact references.

- [ ] **Step 1: Write failing tests for evidence correlation**

Verify evidence emitted by direct execution and Chamber execution can both be associated with the originating execution and lifecycle event stream.

- [ ] **Step 2: Write failing tests distinguishing transient execution state from durable evidence**

Verify terminal execution state can be reconstructed from durable records without requiring the in-memory executor instance.

- [ ] **Step 3: Run focused evidence tests**

Expected: failures identify missing first-class evidence boundaries.

- [ ] **Step 4: Implement the minimal evidence contract and persistence path**

Reuse existing event/artifact primitives. Do not create provider-specific evidence models.

- [ ] **Step 5: Run focused tests, typecheck, and build**

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: make execution evidence first-class`

---

### Task 6: Verify end-to-end Nexus execution lifecycle

**Files:**
- Modify: `docs/NEXUS_PROOF.md`
- Modify: `docs/ROADMAP.md`
- Inspect/Modify: existing end-to-end Nexus tests

**Interfaces:**
- Consumes: completed execution, idempotency, lifecycle, retry/replay, and evidence contracts.
- Produces: a repeatable proof of the full domain-neutral execution path.

- [ ] **Step 1: Add an end-to-end test for the complete success path**

Exercise: intent → capability resolution → policy → direct/Chamber execution → lifecycle events → evidence → durable result.

- [ ] **Step 2: Add an end-to-end test for approval-required execution**

Verify high-risk work stops at approval rather than silently executing and that the subsequent approved path resumes with coherent lifecycle evidence.

- [ ] **Step 3: Add an end-to-end idempotency/retry test**

Verify repeated requests and retry behavior preserve the single logical execution/evidence chain.

- [ ] **Step 4: Run the complete verification suite**

Run `npm run typecheck`, `npm test`, and `npm run build`. Expected: all pass.

- [ ] **Step 5: Update proof documentation only for behavior actually demonstrated by tests**

Do not claim production external connectivity when fixtures are still used.

- [ ] **Step 6: Update roadmap completion markers for verified execution-fabric items**

Leave persistence/real-bridge items incomplete unless the implementation actually satisfies them.

- [ ] **Step 7: Commit**

Commit message: `docs: verify Nexus execution fabric`

---

## Verification Checklist

- [ ] Deterministic execution identity is stable.
- [ ] Idempotent initiation is atomic and tested.
- [ ] Lifecycle transitions are explicit and invalid transitions are rejected.
- [ ] Lifecycle events route through the executor event sink.
- [ ] Durable lifecycle records preserve execution correlation.
- [ ] Retry/replay behavior is deterministic and observable.
- [ ] Evidence survives beyond the in-memory execution.
- [ ] Direct and Chamber execution use the same evidence model.
- [ ] Approval-required execution is enforced and auditable.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Documentation matches demonstrated behavior.

## Plan Self-Review

- **Spec coverage:** execution lifecycle, idempotency, retry/idempotency semantics, durable execution history, artifact/evidence promotion, and end-to-end proof are covered by Tasks 1–6.
- **Provider neutrality:** no task adds a provider-specific core primitive.
- **Scope:** persistence changes are limited to what is necessary for execution durability; real external bridge expansion is intentionally deferred.
- **Critical reformation:** none of the planned changes alters Resonance's identity, core domain semantics, source-of-truth hierarchy, or fundamental architecture.
- **No placeholders:** every task has concrete files/categories, tests, implementation direction, verification, and commit boundaries.
