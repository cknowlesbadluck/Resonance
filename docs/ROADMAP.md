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
- [x] Directory slots are `planned` until a configured adapter exists; fixtures publish as unavailable
- [ ] Retire any remaining client-only capability shape if one is still decoded beside `NexusCapability`
- [ ] `nexus_capabilities` rows on the live database match that publication

### P3 — Native execution loop (IN PROGRESS)
- [x] Swift package client sends Idempotency-Key and Bearer
- [x] App sources in `ios/App` can preview a plan only after an Xcode app target exists
- [ ] Physical device verification and SideStore IPA. Swift package tests are not that proof.

### P4 — Integration & adapters (IN PROGRESS)
- [x] GitHub repository-read adapter and failure matrix
- [x] Inbound webhook signature over the raw body, 1 MiB bound, delivery-id dedupe, no ack without persistence (`docs/EXECUTION_SEMANTICS.md`)
- [ ] Production host `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET` on Netlify `resonancenexus`
- [ ] Authenticated durable evidence for `github.repository.read` after process restart

### P5 — Chamber / composition fabric (IN PROGRESS)
- [x] Bounded chamber scenario: agenda, participants, permitted capabilities, context, approval pause, resume or cancel, dissolve, retained project-scoped audit (`src/nexus/chamber-scenario.ts`)
- [ ] Same scenario persisted in Supabase and visible from the control surface

### P6 — Release / deployment stage (IN PROGRESS)
- [x] Host-neutral deploy contract and `/api/health` + `/api/ready`
- [x] Production user-data routes refuse in-memory fallback
- [ ] Live host env from `.env.example` and `/api/ready` 200
- [ ] SideStore IPA on a physical iPhone (not a Swift package test)

## Definition of done

1. On `main` via green PR
2. Linear Done + AGENT_LOG
3. No parallel domain model for that concern
