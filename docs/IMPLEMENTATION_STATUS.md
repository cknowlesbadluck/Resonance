# Resonance Implementation Status

## Six-phase sprint status — updated 2026-08-21

The six-phase sprint is active against the canonical `main` branch. The implementation is being advanced additively: Nexus contracts remain the center, the web surface is a client, Supabase remains the operational persistence foundation, and native iOS consumes the same API contracts.

### Phase 1 — Core Resonance
- Provider-neutral capability contracts remain the core boundary (`NexusCapability`).
- Catalog plane (`lib/capabilities`) maps into Nexus via `capability-bridge` (CHR-33 interim).
- Capability ranking considers availability, risk, cost, and latency metadata.
- Execution plans support bounded retry policy.
- Executor retries failed adapter calls with linear backoff and preserves correlation IDs.
- Supabase persistence stores capability cost/latency telemetry.
- Nexus API surfaces cover capabilities, intents, executions, identities, events, and webhooks.

### Phase 2 — Web surface
- Web Nexus surface is connected to the real execution endpoint.
- Compose Intent invokes the Nexus execution API and reports completion, approval-required, or error states.
- Spatial depth around central Nexus visualization and capability surfaces.

### Phase 3 — Backend/data
- Resonance Supabase project active; RLS enabled on core tables.
- Durable idempotency: `Idempotency-Key` **required** (HTTP 400 if missing). Unique index on `(project_id, idempotency_key)`.
- Durable-first execution + rate limit (30/min/project) + minimal Chamber primitive **merged** (PR #25).

### Phase 4 — Integration layer
- HTTP and MCP behind provider-neutral adapter contracts.
- Demo bridges prove normalized invocation.

### Phase 5 — Production hardening
- CI: web typecheck/test/build + Swift package tests on macos-latest.
- Branch protection + required status checks active.

### Phase 6 — Native iOS
- Swift 6 package (`ios/`), actor-isolated `NexusClient`, header-aware transport.
- App Intents: List / Compose / Execute / Open + `NexusCapabilityEntity` + Keychain token store **merged** (PR #27).
- Spatial Nexus UI; SideStore-viable constraints documented.

## Repository health metrics (2026-08-21)

| Metric | Value | Signal |
|--------|-------|--------|
| Open PRs | 0 | Good |
| Total branches | 2 (`main`, `develop`) | Good — pruned 36+ stale |
| Near-duplicate branches | 0 | Good |
| `main` protected | **true** | Good |
| Required CI status checks | enforced | Good |

**Rule:** If open-PR count or duplicate-branch count is trending up, stop building and start merging/closing.

## Current next gates

1. ~~Branch protection / governance / Idempotency-Key~~ **Done**.
2. ~~Durable execution + Chamber primitive~~ **Done** (PR #25).
3. ~~App Intents device agency~~ **Done** (PR #27).
4. ~~Prune event-lifecycle* and stale sprint branches~~ **Done** (2026-08-21).
5. **CHR-33 residual:** keep `NexusCapability` as sole public contract; treat `lib/capabilities` as internal catalog only (bridge already in place). Optionally thin/retire direct catalog exports from API routes.
6. Replace remaining demo adapter registrations with production bridges where credentials exist.
7. Complete lifecycle/failure-path tests; provider isolation verification.
8. SideStore-loadable IPA + end-to-end Nexus path (issue #11).

## Governance process (active)

- `docs/AGENT_LOG.md` — append-only session log.
- Linear is backlog; GitHub is execution.
- Two-Key exceptions documented in `docs/ARCHITECTURE.md`.
- Branch protection live repository-wide.
