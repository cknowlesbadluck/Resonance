# Resonance Implementation Status

## Six-phase sprint status — updated 2026-08-31 (MasterDev)

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
- **CHR-51 Option A (PR #48):** `executing` is the exclusive in-flight claim. Stale `accepted` (never started, >5 min) can be reclaimed; `executing` is not.

### Phase 4 — Integration layer
- HTTP and MCP remain behind provider-neutral adapter contracts.
- **GitHub repository adapter implemented** as the first real provider participant.
- `github.repository.read` is exposed as a normalized Nexus capability when `GITHUB_TOKEN` is configured.
- GitHub adapter contract tests cover authenticated headers, successful reads, and provider failures.
- **CHR-52 (PR #48):** 403 secondary/abuse rate limits classify as `rate_limited`.
- Failure matrix + policy deny (PR #37) merged.

### Phase 5 — Production hardening
- CI: web typecheck/test/build + Swift package tests on macos-latest.
- Branch protection + required status checks active.
- Execution input now propagates through normalized intent metadata into execution steps.
- Event ingestion/query now has the same authentication/membership boundary as Nexus execution when auth is enabled, with bounded payloads.

### Phase 6 — Native iOS
- Swift 6 package (`ios/`), actor-isolated `NexusClient`, header-aware transport.
- App Intents: List / Compose / Execute / Open + Keychain token store merged.
- Dual iOS Capability models retired (#40/#41).
- P4 compose → execute → evidence cockpit on PR #49 (iOS CI was red on missing `Foundation` import; fix in flight).
- Physical-device end-to-end verification remains outstanding (issue #11).

## Repository health metrics (2026-08-31 MasterDev)

| Metric | Value | Signal |
|--------|-------|--------|
| Open PRs | **3** (#49, #48, #47 draft) | Consolidate — no net-new |
| Canonical branches | 2 (`main`, `develop`) | Good |
| Feature / orphan branches | 11 | Prune after PR land |
| `main` protected | **true** | Good |
| Required CI status checks | `web` + `ios` enforced | Good |

**Rule:** If open-PR count or duplicate-branch count trends upward, stop building and start merging/closing.

### Orphan branches to delete after related PRs close
- `feat/execution-fabric-hardening`
- `feat/github-failure-matrix-16135786940844000109`
- `feat/github-failure-matrix-rebased`
- `feat/ios-unify-capabilities-9056121336743830881`
- `feat/ios-unify-capabilities-9056121336743830881-15709869524863003138`
- `chore/extract-invoke-with-retry-13184046344267013500`
- `fix/deferred-hygiene-items-3492584824770904550`
- `jules-4557065144468535906-42c57b63`
- (and the PR head branches once merged/closed)

## Current execution gates

1. ~~Branch protection / governance / Idempotency-Key~~ **Done**.
2. ~~Durable execution + Chamber primitive~~ **Done**.
3. ~~App Intents device agency~~ **Done**.
4. ~~Stale sprint branch pruning (Aug 21, Aug 28)~~ **Done**.
5. **Real provider vertical slice:** GitHub repository-read capability implemented. Credential-backed execution runs in required `web` CI when `GITHUB_VERTICAL_SLICE=1`. Production Netlify still needs `GITHUB_TOKEN`.
6. **CHR-33 / P2:** `NexusCapability` is the sole public contract. Dual iOS models retired.
7. **CHR-51 / CHR-52 (PR #48):** Option A executing-claim + GitHub 403 rate-limit classification. Land on green CI.
8. **iOS P4 (PR #49):** compose → execute → evidence. Blocked on `ios` CI until Foundation import lands.
9. **Production deployment proof:** authenticated execution + durable evidence. PR #47 (Render) is draft.
10. **SideStore gate:** release IPA + physical iPhone execution/evidence verification (issue #11).

## Governance process (active)

- `docs/AGENT_LOG.md` — append-only session log.
- Linear is backlog; GitHub is execution.
- Two-Key exceptions documented in `docs/ARCHITECTURE.md`.
- Branch protection live repository-wide.
