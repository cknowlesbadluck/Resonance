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
- [x] Auth helper when Supabase configured
- [x] Payload bounds on execution POST
- [x] Idempotency contract tests (web)
- [x] Native client sends Idempotency-Key + Bearer (PR #17)
- [ ] Explicit `RESONANCE_AUTH_MODE=required|optional|auto` (PR #21)
- [ ] Approval-resume endpoint (PR #21)
- [ ] Durable list executions/evidence via persistence

### P2 — Capability plane convergence (ACTIVE)
- [x] Interim catalog + resolution merged (PR #18)
- [ ] Single domain model: extend **NexusCapability**
- [ ] Skills / tools / integrations as kinds or tags on NexusCapability
- [ ] API returns Nexus-shaped payloads
- [ ] iOS ResonanceCore aligns (retire parallel long-term `Capability`)
- [ ] Persist via `nexus_capabilities` cut-over

### P3 — Native execution loop
- [ ] iOS compose → execute → result/approval UX
- [ ] Map 400 / 401 / 409 / 422 to user-visible states
- [ ] Project-scoped capability load with Bearer when deployed

### P4 — Integration & adapters
- [ ] Real bridges where credentials exist
- [ ] GitHub webhook signature + dedupe
- [ ] Provider isolation tests

### P5 — Chamber / composition fabric
- [ ] Agenda binding, Chamber lifecycle, toolkit seeding, approval pauses

### P6 — Release readiness
- [ ] Production smoke + branch entropy under control

## Definition of done

1. On `main` via green PR (`web` + `ios`)
2. Linear issue Done with verification notes
3. AGENT_LOG entry
4. No parallel domain model for that concern

## Non-goals (near term)

- Cloudflare as core dependency
- Quicksilver shared core
