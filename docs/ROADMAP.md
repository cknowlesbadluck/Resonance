# Resonance Roadmap

Canonical product and engineering roadmap for `Cknowlesbadluck/resonance`.

## North star

Resonance is a **provider-neutral integration and intelligence Nexus**.
Control planes (web + native iOS) observe, decide, and approve.
Runtime executes under policy. Adapters never bypass capability gates.
Quicksilver is **not** part of this product.

See also: `docs/PRODUCT_VISION.md`, `docs/DEVELOPMENT_GUIDELINES.md`.

## Phase map

### P0 — Governance & CI truth (DONE)
- [x] Branch protection / required `web` + `ios`
- [x] Mandatory `Idempotency-Key`
- [x] AGENT_LOG, Two-Key docs, Linear backlog

### P1 — Hardened execution surface (DONE / landing)
- [x] Auth helper + payload bounds
- [x] iOS Idempotency-Key + Bearer
- [x] `RESONANCE_AUTH_MODE` + approval-resume (PR #21)
- [x] Durable list executions/evidence (this sprint)

### P2 — Capability plane convergence (IN PROGRESS)
- [x] Interim catalog (PR #18)
- [x] Bridge catalog → NexusCapability API payloads (this sprint)
- [ ] Retire dual iOS Capability models long-term
- [ ] `nexus_capabilities` cut-over / dual-write

### P3 — Native execution loop
- [ ] iOS compose → execute → result/approval UX (re-cut from main; #35 closed in hygiene)
- [ ] Typed HTTP error mapping in UI
- [ ] Unified ResonanceCore package

### P4 — Integration & adapters

- [ ] GitHub repository-read vertical slice: required CI artifact verification is pending
- [x] GitHub failure matrix: 401/403/404/429/5xx/timeout/malformed/invalid input
- [ ] Production Netlify `GITHUB_TOKEN` (ops)
- [ ] Webhook hardening, additional provider classes

### P5 — Chamber / composition fabric
- [ ] Agenda, Chamber lifecycle, toolkit seeding, approval pauses

### P6 — Release readiness
- [ ] Production smoke + branch entropy under control

## Definition of done

1. On `main` via green PR
2. Linear Done + AGENT_LOG
3. No parallel domain model for that concern
