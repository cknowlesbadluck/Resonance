# Resonance Implementation Status

## Six-phase sprint status — updated 2026-08-28 (hygiene pass)

The implementation is advancing additively against canonical `main`: Nexus contracts remain the center, web/iOS are clients, Supabase is the operational persistence foundation, and provider-specific behavior remains behind adapters.

### Phase 1 — Core Resonance
- Provider-neutral capability contracts remain the core boundary (`NexusCapability`).
- Catalog plane (`lib/capabilities`) maps into Nexus via `capability-bridge` (CHR-33 convergence remains tracked).
- Capability ranking considers availability, risk, cost, and latency metadata.
- Execution plans support bounded retry policy.
- Executor retries failed adapter calls with linear backoff and preserves correlation IDs.
- Supabase persistence stores capability cost/latency telemetry.
- Nexus API surfaces cover capabilities, intents, executions, identities, events, and webhooks.

### Phase 2 — Web surface
- Web Nexus surface is connected to the execution endpoint.
- Compose Intent invokes the Nexus execution API and reports completion, approval-required, or error states.
- Runtime capability discovery now includes configured provider adapters.

### Phase 3 — Backend/data
- Resonance Supabase project active; RLS enabled on core tables.
- Durable idempotency: `Idempotency-Key` required (HTTP 400 if missing). Unique index on `(project_id, idempotency_key)`.
- Durable-first execution + rate limit (30/min/project) + minimal Chamber primitive merged.

### Phase 4 — Integration layer
- HTTP and MCP remain behind provider-neutral adapter contracts.
- **GitHub repository adapter implemented** as the first real provider participant.
- `github.repository.read` is exposed as a normalized Nexus capability when `GITHUB_TOKEN` is configured.
- GitHub adapter contract tests cover authenticated headers, successful reads, and provider failures.
- **Open:** failure matrix + policy deny hardening (PR #37).

### Phase 5 — Production hardening
- CI: web typecheck/test/build + Swift package tests on macos-latest.
- Branch protection + required status checks active.
- Execution input now propagates through normalized intent metadata into execution steps.
- Event ingestion/query now has the same authentication/membership boundary as Nexus execution when auth is enabled, with bounded payloads.
- Failure-path and provider-isolation verification is the immediate hardening target (PR #37).

### Phase 6 — Native iOS
- Swift 6 package (`ios/`), actor-isolated `NexusClient`, header-aware transport.
- App Intents: List / Compose / Execute / Open + Keychain token store merged.
- Dual iOS Capability models being retired (PR #41; #40 closed as superseded).
- Spatial Nexus UI; SideStore constraints documented.
- Physical-device end-to-end verification remains outstanding (PR #35 / issue #11).

## Repository health metrics (2026-08-28 hygiene)

| Metric | Value | Signal |
|--------|-------|--------|
| Open PRs | **1** (#37) | Review queue |
| Canonical branches | 2 (`main`, `develop`) | Good |
| Feature / orphan branches | 6 (3 PR heads + 3 orphans) | Prune after PR land |
| `main` protected | **true** | Good |
| Required CI status checks | `web` + `ios` enforced | Good |

**Rule:** If open-PR count or duplicate-branch count trends upward, stop building and start merging/closing.

### Orphan branches to delete after related PRs close
- `feat/execution-fabric-hardening`
- `feat/github-failure-matrix-16135786940844000109`
- `jules-4557065144468535906-42c57b63`
- (and the PR head branches once merged/closed)

## Current execution gates

1. ~~Branch protection / governance / Idempotency-Key~~ **Done**.
2. ~~Durable execution + Chamber primitive~~ **Done**.
3. ~~App Intents device agency~~ **Done**.
4. ~~Stale sprint branch pruning (Aug 21, Aug 28)~~ **Done**.
5. **Real provider vertical slice:** GitHub repository-read capability implemented. Credential-backed execution runs in required `web` CI when `GITHUB_VERTICAL_SLICE=1`. Production Render still needs `GITHUB_TOKEN`.
6. **CHR-33 / P2:** `NexusCapability` is the sole public contract. #40/#41 (dual iOS model retirement) closed.
7. **Failure matrix (PR #37):** concurrency, retry exhaustion, provider failure, policy denial, approval, persistence failure, and recovery. CHR-47/48/49 and all outstanding CodeRabbit findings resolved as of `f6c7c42`; CI green; awaiting merge.
8. **Production deployment proof:** authenticated execution + durable evidence.
9. **SideStore gate:** release IPA + physical iPhone execution/evidence verification (issue #11). PR #35 closed unmerged.

## Governance process (active)

- `docs/AGENT_LOG.md` — append-only session log.
- Linear is backlog; GitHub is execution.
- Two-Key exceptions documented in `docs/ARCHITECTURE.md`.
- Branch protection live repository-wide.
