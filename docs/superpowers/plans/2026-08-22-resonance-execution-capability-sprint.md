# Resonance Execution & Capability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Resonance Nexus proof into a deterministic, durable, provider-neutral execution fabric with authoritative capability resolution and verifiable lifecycle/evidence semantics.

**Architecture:** Extend the existing Nexus contracts and executor rather than replacing them. Keep provider-specific behavior behind adapters, keep Supabase behind the persistence interface, and make execution identity, lifecycle, evidence, and capability resolution explicit enough to support later real connectors and iOS clients.

**Tech Stack:** TypeScript, Next.js, Vitest, Supabase/Postgres, Swift package consumed through the existing iOS client.

**Spec:** `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, and the canonical Resonance Master Directive in Linear.

## Global Constraints

- Resonance remains a provider-neutral integration and intelligence Nexus.
- MCP remains one adapter mechanism, not the product boundary.
- Chambers remain one execution mechanism, not the product boundary.
- Quicksilver remains completely separate.
- Provider-specific logic stays in adapters.
- Connection does not imply authority.
- Mutating execution remains attributable and auditable.
- High-impact execution remains approval-gated.
- No critical reformation or irreversible migration is authorized by this plan.
- No new provider becomes a core dependency.
- Existing Nexus and Supabase persistence abstractions are extended rather than duplicated.
- Every completed claim must be backed by tests or CI evidence.

---

## Current Evidence

`src/nexus/types.ts` already defines provider-neutral capability, identity, resource, execution, evidence, event, context, and capability-resolution contracts. fileciteturn6file0L2-L2

`src/nexus/capability-bridge.ts` currently maps the legacy catalog into the canonical Nexus capability shape and exposes resolution. fileciteturn10file0L2-L2

The executor already emits lifecycle events, retries adapter calls, records evidence, and supports approval waiting, but execution identity is still generated inside `NexusExecutor`, and durable execution persistence is performed after execution returns. fileciteturn15file0L2-L2

The HTTP execution route already requires `Idempotency-Key`, performs a database claim, and replays an existing response, but the execution request record is not yet the complete durable lifecycle authority. fileciteturn14file0L2-L2

The existing idempotency hash serializes objects directly, so equivalent requests whose nested key insertion order differs are not guaranteed to hash identically. fileciteturn17file0L2-L2

An existing execution-fabric plan already identified lifecycle, deterministic identity, durable events, retry/replay, evidence, and end-to-end proof as the correct implementation sequence. fileciteturn13file0L2-L2

An open iOS PR currently consolidates duplicate ResonanceCore capability/evidence models and adds forward-compatible enums plus `NexusCapabilityResolution`; it explicitly leaves the client resolution method unwired pending follow-up. fileciteturn25file0L3-L10

---

## File Map

- `src/nexus/idempotency.ts` — canonical deterministic request serialization/hashing.
- `src/nexus/idempotency.test.ts` — deterministic hashing tests.
- `src/nexus/executor.ts` — governed execution lifecycle and evidence emission.
- `src/nexus/executor.retry.test.ts` — retry and approval behavior.
- `src/nexus/executor.lifecycle.test.ts` — explicit lifecycle and event ordering tests.
- `src/nexus/capability-bridge.ts` — canonical capability normalization/resolution boundary.
- `src/nexus/capability-bridge.test.ts` — resolution and normalization tests.
- `src/nexus/persistence/supabase.ts` — durable persistence adapter.
- `app/api/nexus/executions/route.ts` — HTTP execution initiation/idempotency boundary.
- `app/api/nexus/executions/[id]/resume/route.ts` — approval-resume boundary.
- `supabase/migrations/` — only additive persistence changes proven necessary by tests.
- `docs/NEXUS_PROOF.md` — verified architectural proof.
- `docs/ROADMAP.md` — completion state based only on evidence.

---

### Task 1: Make deterministic request hashing canonical

**Files:**
- Modify: `src/nexus/idempotency.ts`
- Test: `src/nexus/idempotency.test.ts`

**Interfaces:**
- Consumes: `NexusIntent`.
- Produces: `hashExecutionRequest(intent): string` with canonical serialization independent of object insertion order.

- [ ] **Step 1: Add a failing nested-order test.**

Create two intents whose `requirements` objects and `metadata` objects contain identical values inserted in different key orders. Assert equal hashes.

- [ ] **Step 2: Run the focused test.**

Run `npm test -- src/nexus/idempotency.test.ts`. Expected: the new canonicalization test fails with the current JSON serialization.

- [ ] **Step 3: Implement a small recursive canonical serializer.**

Sort object keys recursively, preserve array order, preserve primitive JSON values, and hash the resulting JSON string. Do not add a dependency.

- [ ] **Step 4: Run the focused test again.**

Expected: all idempotency tests pass.

- [ ] **Step 5: Commit.**

`fix: canonicalize execution request hashing`

---

### Task 2: Lock explicit executor lifecycle and event semantics

**Files:**
- Create: `src/nexus/executor.lifecycle.test.ts`
- Modify: `src/nexus/executor.ts` only where tests expose ambiguous behavior.

**Interfaces:**
- Consumes: `NexusExecution`, `NexusEvent`, `NexusExecutionPlan`, `ExecutionSink`.
- Produces: deterministic event sequence for start, waiting, retry, step completion/failure, completion/failure.

- [ ] **Step 1: Add tests for successful lifecycle ordering.**

Capture `recordEvent` calls and assert the event types are `execution.started`, `execution.step.completed`, and `execution.completed` for a one-step success.

- [ ] **Step 2: Add tests for approval lifecycle ordering.**

Assert `execution.started` then `execution.waiting`, with zero adapter invocations.

- [ ] **Step 3: Add tests for failed lifecycle ordering.**

Assert `execution.started`, `execution.step.failed`, then `execution.failed` for a final adapter failure.

- [ ] **Step 4: Run focused lifecycle tests.**

Run `npm test -- src/nexus/executor.lifecycle.test.ts src/nexus/executor.retry.test.ts`. Expected: failures identify any ordering/coverage gap.

- [ ] **Step 5: Implement only the missing lifecycle behavior.**

Preserve existing event names where possible; do not introduce a second event bus.

- [ ] **Step 6: Re-run focused tests.**

Expected: PASS.

- [ ] **Step 7: Commit.**

`test: lock Nexus execution lifecycle semantics`

---

### Task 3: Make execution persistence durable at lifecycle boundaries

**Files:**
- Inspect/Modify: `src/nexus/persistence/supabase.ts`
- Inspect/Modify: `app/api/nexus/executions/route.ts`
- Test: existing execution route tests plus a focused persistence test if the repository pattern permits.

**Interfaces:**
- Consumes: execution lifecycle state and `NexusPersistence`.
- Produces: durable execution records whose terminal state does not depend on the in-memory route array.

- [ ] **Step 1: Add a test proving the durable adapter receives the terminal execution.**

Use the existing persistence interface rather than mocking Supabase internals. Assert `saveExecution` is called with the same execution returned by the executor.

- [ ] **Step 2: Add a test for failure persistence.**

Assert failed executions are persisted with `status="failed"` and the error before the HTTP response is returned.

- [ ] **Step 3: Add a test for approval persistence.**

Assert approval-required requests persist their waiting state and response before returning HTTP 202.

- [ ] **Step 4: Run focused execution-route tests.**

Run the repository's existing `executions.route.test.ts` together with the new focused test. Expected: any mismatch between memory state and durable state is exposed.

- [ ] **Step 5: Implement the minimum persistence sequencing required by the tests.**

Do not redesign the database. Reuse existing `nexus_executions` and `nexus_execution_requests` structures unless a concrete missing constraint is demonstrated.

- [ ] **Step 6: Run typecheck and focused tests.**

Expected: PASS.

- [ ] **Step 7: Commit.**

`fix: persist execution lifecycle state coherently`

---

### Task 4: Strengthen canonical capability resolution

**Files:**
- Inspect/Modify: `src/nexus/capability-bridge.ts`
- Inspect/Modify: `lib/capabilities.ts`
- Test: `src/nexus/capability-bridge.test.ts` and `lib/capabilities.test.ts`

**Interfaces:**
- Consumes: catalog capabilities and `CapabilityRequirement`.
- Produces: canonical `NexusCapabilityResolution` with deterministic dependency ordering and availability semantics.

- [ ] **Step 1: Add tests for deterministic resolution order.**

Resolve the same dependency graph multiple times and assert identical capability ordering.

- [ ] **Step 2: Add tests for unavailable dependencies.**

Assert an unavailable dependency is reported in `unavailable` and does not appear in `resolved`.

- [ ] **Step 3: Add tests for unknown/missing capability behavior.**

Assert a missing key appears in `missing` without throwing.

- [ ] **Step 4: Run capability tests.**

Run `npm test -- src/nexus/capability-bridge.test.ts lib/capabilities.test.ts`. Expected: failures expose any nondeterminism or catalog leakage.

- [ ] **Step 5: Normalize resolution through the existing bridge.**

Do not delete the catalog yet. The bridge remains the compatibility boundary until all consumers are migrated and verified.

- [ ] **Step 6: Run typecheck and focused tests.**

Expected: PASS.

- [ ] **Step 7: Commit.**

`fix: harden canonical capability resolution`

---

### Task 5: Wire iOS capability resolution after the existing PR is verified

**Files:**
- Inspect/Modify: `ios/Sources/ResonanceCore/NexusClient.swift`
- Inspect/Modify: `ios/Sources/ResonanceCore/NexusModels.swift`
- Test: `ios/Tests/ResonanceCoreTests/NexusClientTests.swift`

**Interfaces:**
- Consumes: server `NexusCapabilityResolution` response.
- Produces: typed iOS `resolveCapabilities(_ ids: [String])` client API using the existing transport abstraction.

- [ ] **Step 1: Verify PR #30 CI before modifying its branch.**

Do not duplicate or override its model consolidation. Confirm its branch remains mergeable and CI results are available.

- [ ] **Step 2: Add a failing client test for capability resolution.**

Use the existing mock transport pattern in `NexusClientTests.swift` and assert the decoded `requested`, `resolved`, `missing`, and `unavailable` values.

- [ ] **Step 3: Implement the client method through `NexusClient` and existing transport.**

Do not reintroduce the deleted `NexusAPI` transport.

- [ ] **Step 4: Run Swift package tests in CI.**

Expected: PASS; local macOS execution is not assumed.

- [ ] **Step 5: Commit to a dedicated branch/PR if PR #30 is already merged; otherwise add only non-overlapping follow-up work.**

`feat: expose Nexus capability resolution to iOS`

---

### Task 6: Prove the complete execution path

**Files:**
- Modify: `src/nexus/integration.test.ts`
- Modify: `docs/NEXUS_PROOF.md`
- Modify: `docs/ROADMAP.md` only for behaviors actually verified.

**Interfaces:**
- Consumes: capability resolution, policy/composition, executor, persistence/evidence, idempotency.
- Produces: repeatable proof of intent → discovery → policy → execution → evidence → durable result.

- [ ] **Step 1: Add an end-to-end success test.**

Exercise the existing heterogeneous HTTP/MCP fixture through the normalized Nexus model and assert the same execution/evidence contracts are used.

- [ ] **Step 2: Add an approval-required end-to-end test.**

Assert execution pauses before mutation and resumes only through the existing approval path.

- [ ] **Step 3: Add an idempotent replay test.**

Submit equivalent execution requests with the same key and assert one logical execution response.

- [ ] **Step 4: Run `npm run typecheck`.**

Expected: PASS.

- [ ] **Step 5: Run `npm test`.**

Expected: PASS.

- [ ] **Step 6: Run `npm run build`.**

Expected: PASS.

- [ ] **Step 7: Update documentation only from observed results.**

Explicitly distinguish fixtures from production external connectivity.

- [ ] **Step 8: Commit.**

`docs: verify Nexus execution capability path`

---

## Verification Checklist

- [ ] Request hashing is canonical across object insertion order.
- [ ] Idempotency conflicts are deterministic.
- [ ] Execution lifecycle event ordering is tested.
- [ ] Approval pauses before invocation.
- [ ] Retry behavior remains bounded and observable.
- [ ] Terminal execution state is durably persisted.
- [ ] Evidence remains correlated to execution IDs.
- [ ] Capability resolution is deterministic.
- [ ] Missing/unavailable capabilities are represented explicitly.
- [ ] iOS consumes the same provider-neutral capability resolution contract.
- [ ] Heterogeneous bridge proof remains intact.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Swift CI passes for affected iOS work.
- [ ] Documentation does not overclaim production connectivity.
