# Resonance Nexus v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Resonance from a Chamber-centered composition foundation into a working provider-neutral Nexus that can discover capabilities, bridge heterogeneous providers, exchange scoped context, execute under policy, and retain evidence/results without depending on Quicksilver or MCP as the core.

**Architecture:** Preserve the existing Agenda/Chamber/Policy foundations while introducing a provider-neutral Nexus layer above them. Core domain contracts describe identities, capabilities, resources, adapters, intents, context, policies, executions, and evidence; provider-specific translation remains at adapter boundaries. MCP is one bridge, not the core model.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7, Supabase/Postgres with RLS, GitHub, Linear; optional Vitest for focused domain tests.

## Global Constraints

- Resonance is a provider-neutral integration and intelligence nexus.
- Integration without domination.
- Quicksilver remains completely separate; no Quicksilver-specific domain primitive may enter Resonance core.
- MCP is one interoperability mechanism, not Resonance's architecture.
- Chambers are optional execution/composition spaces within Resonance.
- Provider-specific behavior belongs in adapters, not core domains.
- Connection does not imply authority.
- Mutating/high-impact actions require policy and auditability.
- Persistent knowledge may outlive temporary execution.
- GitHub is the engineering source of truth; Linear is the durable planning/decision companion.
- Do not reuse the Quicksilver Supabase project for Resonance.
- No destructive/irreversible migration without explicit approval under the two-key rule.

---

## Task 1: Establish Nexus domain contracts

**Files:**
- Create: `src/nexus/types.ts`
- Create: `src/nexus/capabilities.ts`
- Create: `src/nexus/identity.ts`
- Create: `src/nexus/resources.ts`
- Modify: `src/domain/types.ts`
- Test: `src/nexus/*.test.ts`

**Interfaces:**
- `NexusIdentity`, `NexusCapability`, `NexusResource`, `NexusProvider`, `NexusIntent`, `NexusExecution`, `NexusEvidence`.
- Capability lookup predicates must be provider-neutral.
- Existing `CapabilityLevel`, `Agenda`, `Chamber`, and `PolicyGate` remain usable.

- [ ] **Step 1: Add failing domain tests** covering capability identity, provider-neutral matching, risk classification, and intent requirements.
- [ ] **Step 2: Run the focused test suite and verify the new contracts fail before implementation.**
- [ ] **Step 3: Implement the minimal Nexus types and capability predicates.**
- [ ] **Step 4: Run typecheck and focused tests.**
- [ ] **Step 5: Review the new contracts for Quicksilver-specific leakage and remove any domain-specific assumptions.**
- [ ] **Step 6: Commit:** `feat(nexus): establish provider-neutral domain contracts`.

---

## Task 2: Build the capability registry/graph

**Files:**
- Create: `src/nexus/registry.ts`
- Create: `src/nexus/discovery.ts`
- Create: `src/nexus/registry.test.ts`
- Modify: `supabase/migrations/` with a new Nexus migration containing normalized registry tables and indexes.

**Interfaces:**
- `CapabilityRegistry.register(...)`
- `CapabilityRegistry.list(...)`
- `CapabilityRegistry.findByCapability(...)`
- `CapabilityRegistry.findCompatible(...)`
- Discovery results must retain provider, resource, permission, risk, provenance, and availability metadata.

- [ ] **Step 1: Write failing registry tests for registration, discovery, filtering, compatibility, and duplicate protection.**
- [ ] **Step 2: Run tests and confirm failure.**
- [ ] **Step 3: Implement an in-memory registry used by unit tests and the core composition layer.**
- [ ] **Step 4: Add the persistent schema for identities/providers/capabilities/resources/links without deleting the existing tables.**
- [ ] **Step 5: Add indexes for project, provider, capability key, resource, and status lookups.**
- [ ] **Step 6: Run migration validation plus tests.**
- [ ] **Step 7: Commit:** `feat(nexus): add capability registry and graph foundation`.

---

## Task 3: Define adapter and bridge contracts

**Files:**
- Create: `src/nexus/adapters/types.ts`
- Create: `src/nexus/adapters/registry.ts`
- Create: `src/nexus/adapters/mcp.ts`
- Create: `src/nexus/adapters/http.ts`
- Create: `src/nexus/adapters/*.test.ts`

**Interfaces:**
- `NexusAdapter.describe()` exposes normalized identity/capabilities/resources.
- `NexusAdapter.invoke()` accepts a normalized invocation request and returns a normalized result.
- `AdapterRegistry.register()` and `AdapterRegistry.resolve()` manage adapters.

- [ ] **Step 1: Write failing adapter-contract tests using fake MCP and HTTP adapters.**
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement the provider-neutral adapter contract and registry.**
- [ ] **Step 4: Implement an MCP adapter boundary that translates MCP tools/resources into Nexus capabilities without making MCP types core-domain dependencies.**
- [ ] **Step 5: Implement a minimal HTTP/webhook adapter contract for a second integration mechanism.**
- [ ] **Step 6: Test identical discovery/invocation behavior through both adapter types.**
- [ ] **Step 7: Commit:** `feat(nexus): add provider-neutral bridge adapters`.

---

## Task 4: Build the context/resource fabric

**Files:**
- Create: `src/nexus/context.ts`
- Create: `src/nexus/context.test.ts`
- Create: `src/nexus/resources.ts` implementation if split from Task 1
- Create: `supabase/migrations/<timestamp>_nexus_context.sql`

**Interfaces:**
- `ContextStore.put()`
- `ContextStore.viewFor(actor, scope)`
- `ContextStore.promoteToKnowledge()`
- `ResourceResolver.resolve()`

- [ ] **Step 1: Write failing tests for scoped visibility, provenance, working-vs-persistent lifetime, and denied context access.**
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement in-memory scoped context with explicit visibility and provenance.**
- [ ] **Step 4: Add persistent context/knowledge tables and RLS-compatible ownership/project scoping.**
- [ ] **Step 5: Add resource references so context can point to external resources without copying their entire contents into Resonance.**
- [ ] **Step 6: Verify context cannot cross an actor/scope boundary without policy approval.**
- [ ] **Step 7: Commit:** `feat(nexus): add scoped context and resource fabric`.

---

## Task 5: Implement policy-aware intent composition

**Files:**
- Create: `src/nexus/composer.ts`
- Create: `src/nexus/policy.ts`
- Create: `src/nexus/composer.test.ts`
- Modify: `src/policy/gate.ts` only where a normalized Nexus policy request is needed.

**Interfaces:**
- `composeIntent(intent, registry, policy, adapters)` returns a provider-neutral execution plan.
- Plans contain required capabilities, selected candidates, context requirements, permissions, approval requirements, and execution mode (`direct` or `chamber`).

- [ ] **Step 1: Write failing tests for capability matching, incompatible provider rejection, permission escalation, and direct-vs-Chamber selection.**
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement deterministic composition using registry metadata; do not introduce an autonomous LLM planner yet.**
- [ ] **Step 4: Integrate the existing `PolicyGate` before any mutating capability is selected for execution.**
- [ ] **Step 5: Add explicit approval requirements to the plan rather than silently executing privileged operations.**
- [ ] **Step 6: Run focused tests and typecheck.**
- [ ] **Step 7: Commit:** `feat(nexus): compose intents through governed capabilities`.

---

## Task 6: Connect composition to execution and existing Chambers

**Files:**
- Create: `src/nexus/executor.ts`
- Create: `src/nexus/executor.test.ts`
- Modify: `src/chambers/runtime.ts` to expose a Nexus-compatible execution path without changing Chamber semantics.

**Interfaces:**
- `NexusExecutor.execute(plan)` returns execution, evidence, artifacts, and durable event records.
- A plan marked `direct` invokes an adapter without creating a Chamber.
- A plan marked `chamber` creates/uses the existing Chamber runtime.

- [ ] **Step 1: Write failing tests for direct execution, Chamber execution, policy denial, adapter failure, and result persistence.**
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement direct execution through the adapter registry.**
- [ ] **Step 4: Add the Chamber bridge that maps a composed plan into an Agenda/Chamber request.**
- [ ] **Step 5: Emit normalized execution events for every meaningful action.**
- [ ] **Step 6: Persist evidence and artifacts without requiring the Chamber to remain alive.**
- [ ] **Step 7: Run focused tests and typecheck.**
- [ ] **Step 8: Commit:** `feat(nexus): execute composed plans through direct and Chamber paths`.

---

## Task 7: Harden event/audit ingestion

**Files:**
- Modify: `app/api/events/route.ts`
- Modify: `app/api/webhooks/github/route.ts`
- Create: `src/nexus/events.ts`
- Create: `src/nexus/events.test.ts`
- Modify: Supabase migrations for event deduplication/indexing if required.

**Interfaces:**
- `EventBus.publish()`
- `EventBus.dedupe()`
- `AuditRecorder.record()`

- [ ] **Step 1: Write failing tests for normalized event envelopes, external event dedupe, actor attribution, and audit records for mutations.**
- [ ] **Step 2: Run tests and verify failure.**
- [ ] **Step 3: Implement normalized event envelopes with provider/source metadata and correlation IDs.**
- [ ] **Step 4: Preserve existing GitHub webhook behavior while routing it through the normalized event bus.**
- [ ] **Step 5: Ensure mutation paths write audit evidence and do not rely on UI-only logging.**
- [ ] **Step 6: Validate webhook signature handling remains mandatory before persistence.**
- [ ] **Step 7: Run tests and typecheck.**
- [ ] **Step 8: Commit:** `feat(nexus): normalize events and mutation audit`.

---

## Task 8: Add Nexus API/control-plane surface

**Files:**
- Create: `app/api/nexus/capabilities/route.ts`
- Create: `app/api/nexus/identities/route.ts`
- Create: `app/api/nexus/intents/route.ts`
- Create: `app/api/nexus/executions/route.ts`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- GET capabilities: discover normalized capabilities.
- POST intent: compose and optionally execute according to policy.
- GET executions: inspect evidence/status.
- GET identities: inspect participants/providers/resources.

- [ ] **Step 1: Write API contract tests for capability discovery and intent composition.**
- [ ] **Step 2: Implement read-only capability/identity endpoints.**
- [ ] **Step 3: Implement intent composition endpoint with execution disabled by default unless the plan is explicitly authorized.**
- [ ] **Step 4: Implement execution/evidence read endpoint.**
- [ ] **Step 5: Update the control-plane UI to show the Nexus graph at a useful summary level: connected participants, capabilities, active compositions, approvals, and recent evidence.**
- [ ] **Step 6: Keep UI concerns out of core domain modules.**
- [ ] **Step 7: Run build/typecheck and API tests.**
- [ ] **Step 8: Commit:** `feat(ui): expose Resonance Nexus control plane`.

---

## Task 9: Provider bridge proof without Quicksilver

**Files:**
- Create: `src/nexus/fixtures/`
- Create: `src/nexus/integration.test.ts`
- Create: `docs/NEXUS_PROOF.md`

**Interfaces:**
- Two independent bridge implementations must expose the same normalized capability contract.
- The proof scenario must not reference Quicksilver types, paths, or assumptions.

- [ ] **Step 1: Define a synthetic resource and an external-provider-style adapter that do not depend on Quicksilver.**
- [ ] **Step 2: Define an MCP-style capability fixture using the MCP adapter boundary.**
- [ ] **Step 3: Compose one intent requiring capabilities exposed through both bridges.**
- [ ] **Step 4: Execute the intent under policy.**
- [ ] **Step 5: Verify evidence, context scoping, and persistent result behavior.**
- [ ] **Step 6: Record the proof in `docs/NEXUS_PROOF.md`.**
- [ ] **Step 7: Commit:** `test(nexus): prove heterogeneous bridge composition`.

---

## Task 10: Production hardening and project synchronization

**Files:**
- Modify: `README.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/ROADMAP.md`
- Create: `docs/NEXUS_OPERATING_MODEL.md`
- Create: `docs/PLUGIN_BRIDGE_MATRIX.md`
- Modify: Linear Resonance project and canonical directive as needed to reflect verified implementation state.

- [ ] **Step 1: Run the full typecheck/build/test suite.**
- [ ] **Step 2: Review the complete diff for provider leakage, Quicksilver leakage, accidental MCP coupling, missing audit paths, and privilege escalation.**
- [ ] **Step 3: Verify database migrations and RLS policies are internally consistent.**
- [ ] **Step 4: Verify the API surface does not expose service-role credentials or bypass authorization.**
- [ ] **Step 5: Update documentation to describe the actual Nexus architecture rather than the previous Chamber-centered identity.**
- [ ] **Step 6: Update Linear with completed work, remaining gaps, and evidence.**
- [ ] **Step 7: Create a final release checkpoint/commit only after verification is clean.**

---

## Verification gates

The implementation is not considered Nexus v1 complete until all of the following are true:

1. TypeScript build passes.
2. Focused Nexus tests pass.
3. Integration proof passes through at least two bridge mechanisms.
4. No Resonance core type references Quicksilver.
5. MCP is isolated behind an adapter boundary.
6. At least one direct execution and one Chamber execution path work.
7. Context is scoped and policy-aware.
8. Mutations create durable audit evidence.
9. Results survive Chamber dissolution.
10. Documentation, Linear state, and GitHub source agree on the actual architecture.

## Explicitly deferred

- Full external connector catalog.
- Automatic LLM-based capability planning.
- Marketplace/discovery economy.
- Multi-tenant enterprise authorization productization.
- iOS cockpit implementation.
- Provider-specific production adapters beyond the first proof set.
- Quicksilver-specific integration. It remains an independent future proving ground.
