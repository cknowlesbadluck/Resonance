# Resonance Roadmap

Canonical product and engineering roadmap for `Cknowlesbadluck/resonance`.

## North star

Resonance is a **provider-neutral integration and intelligence Nexus**.
Control planes (web + native iOS) observe, decide, and approve.
Runtime executes under policy. Adapters never bypass capability gates.
Quicksilver is **not** part of this product.

See also: `docs/PRODUCT_VISION.md`, `docs/DEVELOPMENT_GUIDELINES.md`, `docs/DEPLOYMENT.md`.

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
- [ ] iOS compose → execute → result/approval UX (re-cut #49; do not revive #35)
- [x] Typed HTTP error mapping in UI (iOS P3 branch)
- [x] Unified ResonanceCore package (CHR-38)

### P4 — Integration & adapters

- [x] GitHub repository-read vertical slice in required `web` CI (artifact gate)
- [x] GitHub failure matrix: 401/403/404/429/5xx/timeout/malformed/invalid input
- [ ] Production host `GITHUB_TOKEN` (ops — issue #32; host is Netlify `resonancenexus` today)
- [ ] Webhook hardening, additional provider classes

### P5 — Chamber / composition fabric
- [ ] Agenda, Chamber lifecycle, toolkit seeding, approval pauses

### P6 — Release / deployment stage (IN PROGRESS — CHR-53)
- [x] Host-neutral deploy contract (presence only; never echo secrets)
- [x] `GET /api/health` liveness and `GET /api/ready` readiness
- [x] Production smoke cases (Idempotency-Key 400, structured ready, health 200)
- [x] Aggregate GitHub Actions job named `CI` (depends on `web` + `ios`)
- [ ] Live host: `RESONANCE_AUTH_MODE=required` + `/api/ready` 200 (ops)
- [ ] Authenticated GitHub vertical slice evidence on the live host (issue #32)
- [ ] Branch entropy held flat across consecutive sessions
- [ ] SideStore IPA / on-device proof (issue #11, I4 — not a host concern)

## Definition of done

1. On `main` via green PR
2. Linear Done + AGENT_LOG
3. No parallel domain model for that concern
