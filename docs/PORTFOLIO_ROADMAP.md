# Portfolio 10-Phase Roadmap (2026-10-10)

Unified highest-efficacy path for Resonance, QuicksilverV1, and Conduit. Evidence-based from live probes, open PRs, Dependabot, and Linear.

## Phase 0 — Stabilize & Hygiene (this cycle)
- Prune duplicate docs/roadmap-refresh-* and stale cutover branches after consolidating into this document.
- Close or merge green hygiene PRs (npm audit, proxy-addr critical, capability shape retirement).
- Exit: open PR count < 5 per repo, Dependabot critical/high addressed or explicitly deferred with rationale, main CI green.

## Phase 1 — Owner Gates Unblock
- Set SUPABASE_SERVICE_ROLE_KEY on Netlify resonancenexus; confirm /api/ready 200 with contract fields.
- Apply pending Supabase migrations.
- Exit: public ready 200, no ownerActionRequired omitted.

## Phase 2 — Capability Convergence
- Single NexusCapability model everywhere (retire remaining client-only shapes).
- Directory slots match live adapters.
- Exit: typecheck + tests green, no dual models on main.

## Phase 3 — Durable Execution & Evidence
- Chamber scenario persisted in Supabase, visible from control surface.
- Idempotency + auth proven end-to-end.
- Exit: live evidence after process restart.

## Phase 4 — Native iOS Peer
- Full compose → plan → execute → approve loop on device via SideStore IPA.
- App Intents for Nexus intent.
- Exit: physical iPhone 16e proof, not just package tests.

## Phase 5 — Chamber / Composition Fabric
- Work chamber dissolves with audit; watch chamber refuses dissolve.
- Skill plane durable.
- Exit: bounded scenario passes on live host.

## Phase 6 — Production Adapters
- GitHub token + webhook secret on host; authenticated durable evidence.
- Additional adapters behind same contract.
- Exit: failure matrix green, no secrets in repo.

## Phase 7 — Hardening & Security
- Dependabot zero critical/high open.
- Rate limits, payload bounds, TLS, signed cursors verified.
- Exit: security scans clean, fail-closed proven.

## Phase 8 — Observability
- Structured logs, readiness probes with cold-start tolerance, diagnostics surface.
- Exit: /health and /ready stable under load.

## Phase 9 — Release Readiness
- Version bump, CHANGELOG, device HG for Quicksilver, SideStore path reliable.
- Exit: 1.0 candidate on main, Linear Done.

## Phase 10 — Innovate Composition Extensions
- Provider substitution demos, multi-agent Agenda templates, on-device model seam for Quicksilver gateway.
- Exit: at least one new vertical slice shipped without domain leakage.

**Non-goals this cycle:** inventing secrets, merging blocked PRs, claiming device proof without evidence, Quicksilver/Resonance coupling.

Owner retains Two-Key for critical reformations. Autonomy authorized for hygiene and this roadmap.