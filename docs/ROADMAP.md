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

### P1 — Hardened execution surface (DONE)
- [x] Auth helper + payload bounds
- [x] iOS Idempotency-Key + Bearer
- [x] `RESONANCE_AUTH_MODE` + approval-resume
- [x] Bounded rate limiting (30/min/project) and claim token validation

### P2 — Capability plane convergence (IN PROGRESS)
- [x] Interim catalog (`lib/capabilities.ts`)
- [x] Bridge catalog → NexusCapability API payloads (`src/nexus/capability-bridge.ts`)
- [ ] Retire dual iOS Capability models in `ResonanceCore`
- [ ] `nexus_capabilities` cut-over / complete model unification

### P3 — Native execution loop (IN PROGRESS)
- [ ] iOS compose → execute → result/approval UX (re-cut #49; do not revive #35)
- [x] Typed HTTP error mapping in UI
- [x] Unified ResonanceCore package (CHR-38)
- [ ] Physical device verification and SideStore compatibility

### P4 — Integration & adapters (IN PROGRESS)
- [x] GitHub repository-read vertical slice in required `web` CI
- [x] GitHub failure matrix: 401/403/404/429/5xx/timeout/malformed/invalid input
- [ ] Production host `GITHUB_TOKEN` (ops — issue #32; host is Netlify `resonancenexus` today)
- [ ] Inbound webhook signature verification and raw event bus deduplication

### P5 — Chamber / composition fabric (PLANNED)
- [x] Basic Chamber execution primitive in runtime
- [ ] Agenda scheduling, Chamber lifecycle, toolkit seeding, and approval pauses
- [ ] Multi-participant coordination engine

### P6 — Release / deployment stage (IN PROGRESS — CHR-53)
- [x] Host-neutral deploy contract (presence only; never echo secrets)
- [x] `GET /api/health` liveness and `GET /api/ready` readiness
- [x] Production smoke cases (Idempotency-Key 400, structured ready, health 200)
- [x] Aggregate GitHub Actions job named `CI` (depends on `web` + `ios`)
- [ ] Live host: `RESONANCE_AUTH_MODE=required` + `/api/ready` 200 (ops)
- [ ] Authenticated GitHub vertical slice evidence on live Netlify host
- [ ] Branch entropy held flat across consecutive sessions
- [ ] SideStore IPA / on-device proof (issue #11, I4)

## Definition of done

1. On `main` via green PR
2. Linear Done + AGENT_LOG
3. No parallel domain model for that concern
