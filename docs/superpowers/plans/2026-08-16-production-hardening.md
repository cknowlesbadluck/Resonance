# Resonance Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Nexus runtime from green CI to production-testable behavior with authenticated, validated, durable, idempotent execution and auditable evidence.

**Architecture:** Keep the existing Nexus domain contracts and Supabase persistence layer. Replace route-local process memory with durable persistence, introduce a request authentication/authorization boundary, validate and bound inputs, and use durable execution/evidence records as the source of truth. Preserve provider neutrality so local Lemonade can later implement the same capability boundary without changing Nexus core behavior.

**Tech Stack:** Next.js route handlers, TypeScript, Supabase/Postgres, existing Nexus executor/types/persistence, GitHub Actions.

## Global Constraints

- Do not make Lemonade or AMD hardware a required Resonance dependency.
- Do not expose the Supabase service-role key to request-scoped clients.
- Do not claim MCP production readiness until an authenticated deployed endpoint exists.
- Preserve existing Nexus intent, plan, execution, capability, evidence, and policy contracts unless a compatibility-preserving extension is required.
- Every production behavior change must have a focused automated test and a passing full CI run.

---

### Task 1: Lock down request authentication and validation

**Files:**
- Modify: `app/api/nexus/executions/route.ts`
- Inspect: existing auth utilities under `src/` and `app/api/`
- Test: existing Nexus/API test locations plus a focused execution-route test

**Interfaces:**
- Consumes: `NexusIntent`, existing project/member auth model, `NexusExecutor`.
- Produces: authenticated POST/GET behavior with bounded JSON input and explicit 401/403/400 responses.

- [ ] **Step 1: Write failing tests** for missing credentials, unauthorized project access, malformed intent, oversized objective/context, and valid authenticated request.
- [ ] **Step 2: Run the focused test suite and confirm failures.**
- [ ] **Step 3: Implement the smallest reusable request-auth helper using the project's existing Supabase/auth conventions.**
- [ ] **Step 4: Add strict schema validation and bounded payloads without changing the domain types.**
- [ ] **Step 5: Run focused tests and confirm all pass.**
- [ ] **Step 6: Commit with `security: authenticate and validate nexus execution requests`.**

### Task 2: Make Nexus execution and evidence durable

**Files:**
- Modify: `app/api/nexus/executions/route.ts`
- Modify: `src/nexus/persistence/supabase.ts`
- Modify: `src/nexus/types.ts` only if durable metadata requires a backwards-compatible field
- Test: Nexus persistence and execution route tests

**Interfaces:**
- Consumes: `NexusPersistence`, `NexusExecution`, `NexusEvidence`.
- Produces: database-backed execution/evidence state that survives process restart and multiple instances.

- [ ] **Step 1: Write failing tests proving POST does not depend on route-local arrays and GET reads durable state.**
- [ ] **Step 2: Run the focused tests and confirm failure.**
- [ ] **Step 3: Add read/list methods to `NexusPersistence` and implement them with parameterized Supabase queries.**
- [ ] **Step 4: Replace route-local `executions`/`evidence` arrays with the persistence implementation and preserve the existing response contract.**
- [ ] **Step 5: Ensure completed and failed execution records are persisted even when the executor throws.**
- [ ] **Step 6: Run persistence and route tests and commit `feat: persist nexus execution state`.**

### Task 3: Add idempotency, retry safety, and durable audit semantics

**Files:**
- Modify: `supabase/migrations/<new execution hardening migration>`
- Modify: `src/nexus/persistence/supabase.ts`
- Modify: `app/api/nexus/executions/route.ts`
- Test: execution idempotency/retry tests

**Interfaces:**
- Consumes: authenticated request identity plus `NexusIntent.id`.
- Produces: repeat-safe execution creation and an audit trail keyed by execution/correlation identity.

- [ ] **Step 1: Write failing tests for duplicate request identifiers and executor retry behavior.**
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Add a database uniqueness constraint/index for the chosen idempotency key and the minimum audit metadata required by the current schema.**
- [ ] **Step 4: Implement atomic lookup/create semantics so duplicate requests return the existing execution rather than execute twice.**
- [ ] **Step 5: Persist attempt/status transitions and evidence consistently.**
- [ ] **Step 6: Run focused tests and commit `feat: make nexus execution idempotent and auditable`.**

### Task 4: Replace the fixture capability registry with persisted/provider-backed discovery

**Files:**
- Modify: `app/api/nexus/capabilities/route.ts`
- Inspect/modify: `src/nexus/runtime.ts`
- Modify: `src/nexus/persistence/supabase.ts`
- Test: capability discovery tests

**Interfaces:**
- Consumes: persisted `nexus_capabilities` records and existing provider/adaptor contracts.
- Produces: project-scoped capability discovery with availability metadata and no process-local fixture dependency in production routes.

- [ ] **Step 1: Write failing tests proving capability GET is project-scoped and independent of process memory.**
- [ ] **Step 2: Run focused tests and confirm failure.**
- [ ] **Step 3: Implement persisted capability listing with explicit project authorization.**
- [ ] **Step 4: Keep demo fixtures available only behind an explicit development/test path.**
- [ ] **Step 5: Run focused tests and commit `feat: persist nexus capability discovery`.**

### Task 5: Add production rate limits and payload/resource bounds

**Files:**
- Modify: authenticated Nexus route layer
- Create/modify: small reusable rate-limit helper following existing project conventions
- Test: rate-limit and payload-bound tests

**Interfaces:**
- Consumes: authenticated actor/project identity and request metadata.
- Produces: deterministic 429 responses with bounded execution request sizes.

- [ ] **Step 1: Write failing tests for repeated requests over the configured threshold and oversized inputs.**
- [ ] **Step 2: Implement the smallest deployment-safe limiter that does not rely on process memory when a durable/shared mechanism is available in the existing stack.**
- [ ] **Step 3: Apply bounds to objective, requirements, context references, and serialized payloads.**
- [ ] **Step 4: Run focused tests and commit `security: bound and rate-limit nexus requests`.**

### Task 6: Production smoke-test workflow and documentation

**Files:**
- Modify: `.github/workflows/*` only where required
- Create: `docs/PRODUCTION_TESTING.md`
- Modify: `docs/ROADMAP.md` and issue #8 status documentation as appropriate

**Interfaces:**
- Consumes: hardened Nexus endpoints and CI artifacts.
- Produces: repeatable production-like smoke-test instructions and explicit release gates.

- [ ] **Step 1: Add automated smoke checks that can run with configured test credentials without embedding secrets.**
- [ ] **Step 2: Document local and deployed verification sequences, including auth, persistence, duplicate requests, denial paths, and restart durability.**
- [ ] **Step 3: Run the full existing validation suite.**
- [ ] **Step 4: Run the smoke workflow and verify artifacts/results.**
- [ ] **Step 5: Commit `test: add production nexus smoke verification`.**

### Task 7: Provider boundary for optional local AI

**Files:**
- Modify: existing Nexus provider/capability contracts only where needed
- Create: local-provider abstraction and tests; do not add the Lemonade runtime itself yet
- Test: provider capability contract tests

**Interfaces:**
- Consumes: normalized capability/provider contracts.
- Produces: a provider-neutral local inference interface that can later be implemented by Lemonade without coupling Nexus core to AMD.

- [ ] **Step 1: Write contract tests for a local provider exposing chat/inference capability metadata.**
- [ ] **Step 2: Implement the minimal provider interface adapter.**
- [ ] **Step 3: Verify cloud providers and the local provider share the same capability selection/execution contract.**
- [ ] **Step 4: Document Lemonade as an optional implementation target.**
- [ ] **Step 5: Commit `feat: define local ai provider boundary`.**

## Verification Gate

The work is not production-ready until all of the following are demonstrated:

- [ ] Typecheck passes.
- [ ] Full test suite passes.
- [ ] Production build passes.
- [ ] Authenticated requests succeed.
- [ ] Unauthenticated requests are rejected.
- [ ] Unauthorized project access is rejected.
- [ ] Invalid and oversized requests are rejected.
- [ ] Duplicate requests do not execute twice.
- [ ] Execution/evidence state survives process restart.
- [ ] Capability discovery is persisted and project-scoped.
- [ ] Rate limits produce deterministic rejection behavior.
- [ ] Audit evidence is durable and correlated to execution identity.
- [ ] No production route requires AMD/Lemonade to function.
- [ ] MCP production claims remain gated on an authenticated deployed endpoint.
