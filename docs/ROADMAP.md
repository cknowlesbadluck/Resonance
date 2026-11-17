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
- [x] Control surface gates invoke on `executable` and shows `unexecutableReason` (availability alone is not enough)
- [ ] Retire any remaining client-only capability shape if one is still decoded beside `NexusCapability`
- [ ] `nexus_capabilities` rows on the live database match that publication
- [x] Idempotent external event replay via `Idempotency-Key` / `external_id` with regression tests (merged PR #266, 2026-11-12)
- [ ] Apply the additive public API security migration after the required owner review. Live Supabase inspection on 2026-11-12 confirmed five graph tables still have `PUBLIC` policies permitting unscoped `project_id IS NULL` rows; the `events` and `nexus_execution_requests` policies also target `PUBLIC` rather than `authenticated`. The ACL audit found `anon` had broad privileges on ten public tables, while `authenticated` had `TRUNCATE` and other unnecessary table privileges. Default privileges for both `postgres` and `supabase_admin` also re-granted broad table ACLs to future objects. The migration now tightens all eleven current public API tables, limits grants by operation, removes existing anon/public grants, and makes future public-schema table, sequence, and function privileges deny-by-default for postgres-created objects. Supabase-admin defaults are platform-owned and cannot be changed by the project postgres role. The migration remains unapplied and requires explicit owner authorization.

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
- [x] Skill plane is reachable as resolution-only HTTP (`GET /api/nexus/skills`). It does not execute skill code and is not yet durable
- [x] Same chamber scenario is reachable on `POST /api/nexus/chambers` (policy gate, approval pause, dissolve, audit). Durable when Supabase is configured (`nexus_executions.output` snapshot, `nexus_evidence` audit, `nexus_context_entries` idempotency marker). Control surface has Open chamber. Provider invocation uses the bound adapter; a missing adapter fails the step. Replay does not depend on the last 100 execution rows.
- [ ] Owner applies no extra migration for this path. `GITHUB_TOKEN` on Netlify is still required before `github.repository.read` can succeed inside a chamber.

### P6 — Release / deployment stage (IN PROGRESS)
- [x] Host-neutral deploy contract and `/api/health` + `/api/ready`
- [x] Production user-data routes refuse in-memory fallback
- [x] Live host env from `.env.example` and `/api/ready` 200 (verified by the 2026-11-12 15:02 UTC live probe)
- [ ] SideStore IPA on a physical iPhone (not a Swift package test)

## Definition of done

1. On `main` via green PR
2. Linear Done + AGENT_LOG
3. No parallel domain model for that concern
