# Resonance Implementation Status

## Six-phase sprint status — updated 2026-09-15 (Audit & Strategy Pass)

The implementation is advancing additively against canonical `main`: Nexus contracts remain the center, web/iOS are clients, Supabase is the operational persistence foundation, and provider-specific behavior remains behind adapters. The live web host is **Netlify** `resonancenexus` (`https://resonancenexus.netlify.app`). The host is not a Nexus domain object.

### Phase 1 — Core Resonance
- Provider-neutral capability contracts remain the core boundary (`NexusCapability`).
- Catalog plane (`lib/capabilities.ts`) maps into Nexus via `capability-bridge` (`src/nexus/capability-bridge.ts`).
- Capability ranking considers availability, risk, cost, and latency metadata.
- Execution plans support bounded retry policy.
- Executor retries failed adapter calls with linear backoff, preserves correlation IDs, and performs $O(1)$ adapter map lookups.
- Supabase persistence stores capability cost/latency telemetry.
- Nexus API surfaces cover capabilities, intents, executions, identities, events, and webhooks.

### Phase 2 — Web surface
- Web Nexus surface is connected to the execution endpoint.
- Compose Intent invokes the Nexus execution API and reports completion, approval-required, or error states.
- Runtime capability discovery includes configured provider adapters.

### Phase 3 — Backend/data
- Resonance Supabase project (`lfdynzionafcpddqipqc`) active; RLS enabled on core tables.
- Durable idempotency: `Idempotency-Key` required (HTTP 400 if missing). Unique index on `(project_id, idempotency_key)`.
- Durable-first execution + rate limit (30/min/project) + minimal Chamber primitive merged.

### Phase 4 — Integration layer
- HTTP and MCP remain behind provider-neutral adapter contracts.
- **GitHub repository adapter implemented** as the first real provider participant (`github.repository.read`).
- GitHub adapter contract tests cover authenticated headers, successful reads, and provider failures.
- Failure matrix + policy deny landed on `main`.

### Phase 5 — Production hardening
- CI: web typecheck/test/build + Swift package tests on macos-latest.
- Branch protection + required status checks active. Aggregate job named `CI` depends on `web` + `ios`.
- Execution input propagates through normalized intent metadata into execution steps.
- Event ingestion/query shares the same authentication/membership boundary as Nexus execution when auth is enabled, with bounded payloads.

### Phase 6 — Native iOS
- Swift 6 package (`ios/`), actor-isolated `NexusClient`, header-aware transport.
- App Intents: List / Compose / Execute / Open + Keychain token store merged.
- Dual iOS Capability models being retired.
- Spatial Nexus UI; SideStore constraints documented.
- Physical-device end-to-end verification remains outstanding (issue #11). Open PR #49 is the re-cut compose → execute → evidence slice; do not revive #35.

## Repository health metrics (2026-09-15)

| Metric | Value | Signal |
|--------|-------|--------|
| Test Suite Passing | **100%** (90 passed, 1 skipped) | Excellent |
| Typecheck Status | **Clean** (`tsc --noEmit`) | Excellent |
| Production Build | **Success** (`next build`) | Excellent |
| `main` protected | **true** | Good |
| Required CI status checks | `web` + `ios` + aggregate `CI` | Good |
| Live host | Netlify `resonancenexus` | Operational |

**Rule:** If open-PR count or duplicate-branch count trends upward, stop building and start merging/closing.

## Current execution gates

1. ~~Branch protection / governance / Idempotency-Key~~ **Done**.
2. ~~Durable execution + Chamber primitive~~ **Done**.
3. ~~App Intents device agency~~ **Done**.
4. ~~Stale sprint branch pruning~~ **Done**.
5. **Real provider vertical slice:** GitHub repository-read capability implemented. Credential-backed execution runs in required `web` CI when `GITHUB_VERTICAL_SLICE=1`. Live host still needs `GITHUB_TOKEN` (issue #32).
6. **CHR-33 / P2:** `NexusCapability` is the sole public contract. Dual iOS model retirement tracked.
7. ~~Failure matrix~~ **Done** on `main`.
8. **P6 deployment contract (CHR-53):** health/ready probes + env contract + production smoke. Live `/api/ready` 200 still an ops gate (`RESONANCE_AUTH_MODE=required`).
9. **SideStore gate:** release IPA + physical iPhone execution/evidence verification (issue #11).

## Governance process (active)

- `docs/AGENT_LOG.md` — append-only session log.
- Linear is backlog; GitHub is execution.
- Two-Key exceptions documented in `docs/ARCHITECTURE.md`.
- Branch protection live repository-wide.
