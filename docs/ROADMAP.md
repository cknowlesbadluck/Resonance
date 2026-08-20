# Resonance Roadmap

Canonical product and engineering roadmap for `Cknowlesbadluck/resonance`.
MasterDev / Linear track execution; this document defines sequence and definition of done.

## North star

Resonance is a **provider-neutral integration and intelligence Nexus**.
Control planes (web + native iOS) observe, decide, and approve.
Runtime executes under policy. Adapters never bypass capability gates.

Quicksilver is **not** part of this product.

## Phase map

### P0 — Governance & CI truth (DONE)
- [x] Branch protection / ruleset with required `web` + `ios`
- [x] Mandatory `Idempotency-Key` on execution initiation
- [x] `docs/AGENT_LOG.md` append-only session log
- [x] Two-Key exceptions documented in `ARCHITECTURE.md`
- [x] Linear as backlog; GitHub as execution

### P1 — Hardened execution surface (IN PROGRESS)
- [x] Auth helper (`src/auth/nexus-request.ts`) when Supabase configured
- [x] Payload bounds on execution POST
- [x] Idempotency contract tests (web)
- [x] Native client sends Idempotency-Key + Bearer (PR #17)
- [ ] Explicit `RESONANCE_AUTH_MODE=required|optional` (no accidental open prod)
- [ ] Approval-resume endpoint for `approval_required` executions
- [ ] Durable list executions/evidence via persistence (no process memory in prod paths)

### P2 — Capability plane convergence (ACTIVE)
- [ ] Single domain model: extend **NexusCapability**, do not permanently fork `lib/capabilities`
- [ ] Skills / tools / integrations as kinds or tags on NexusCapability
- [ ] Dependency resolution with cycle detection under Nexus contracts
- [ ] API list + resolve endpoints return Nexus-shaped payloads
- [ ] iOS ResonanceCore models match server contracts (no parallel `Capability` long-term)
- [ ] Persist via `nexus_capabilities` (migrate or dual-write then cut over)
- [ ] Close or rewrite PR #13 / #18 under this plan

### P3 — Native execution loop
- [ ] iOS can compose intent → execute with Idempotency-Key → show result/approval
- [ ] Map 400 / 401 / 409 / 422 to user-visible states
- [ ] Project-scoped capability load with Bearer when deployed
- [ ] Spatial Nexus UI stays a client of the same API

### P4 — Integration & adapters
- [ ] Replace demo adapter registrations with real bridges where credentials exist
- [ ] GitHub webhook signature + dedupe hardening
- [ ] MCP adapter remains behind adapter boundary (not core types)
- [ ] Provider isolation tests

### P5 — Chamber / composition fabric
- [ ] Agenda binding for coordinated runs
- [ ] Temporary Chamber lifecycle (form → work → dissolve)
- [ ] Toolkit seeding from capabilities + policy
- [ ] Approval pauses for privileged steps
- [ ] Evidence + audit survive dissolution

### P6 — Release readiness
- [ ] Observed green CI on release candidate
- [ ] Production smoke (auth, idempotent replay, deny paths, restart durability)
- [ ] Branch entropy under control (no duplicate feature branches)
- [ ] `IMPLEMENTATION_STATUS` health metrics green for two consecutive sessions

## Definition of done (global)

A phase is done only when:
1. Code is on `main` via green PR (`web` + `ios`).
2. Linear issue is Done with verification notes.
3. AGENT_LOG entry records what was verified.
4. No parallel domain model remains for that concern.

## Explicit non-goals (near term)

- Cloudflare as a core dependency
- Quicksilver integration or shared core modules
- Multi-tenant marketplace of arbitrary third-party agents without policy
