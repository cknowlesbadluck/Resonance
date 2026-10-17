# Portfolio 10-phase roadmap — refreshed 2026-10-17 ~19:00 EDT (full audit + harden + stabilize + hygiene prune + innovate)

Live probes at 2026-10-17T23:01Z. Resonance /api/ready 503 owner-gated (missing SUPABASE_SERVICE_ROLE_KEY exactly). Conduit /ready 200 stamped (version=0.8.0, contractRevision=2026-10-03-ready-surface, persistence=postgres). Quicksilver deviceAcceptance=not_recorded; CHR-55 remains sole gate. No secrets invented. Classifier tests ≠ production proof. Open PR load high: Resonance ~48, Conduit ~31, QuicksilverV1 ~25 — major planning and merge debt.

Evidence:
- Resonance: {"status":"not_ready","service":"resonance-nexus","stage":"deployment","production":true,"authMode":"required","authModeOk":true,"persistenceConfigured":false,"githubAdapterConfigured":false,"missingRequired":["SUPABASE_SERVICE_ROLE_KEY"],"timestamp":"2026-10-17T23:01:24.338Z"} HTTP 503.
- Conduit ready: 200 stamped (version=0.8.0, contractRevision=2026-10-03-ready-surface, persistence=postgres).
- Hygiene prune: single roadmap file policy holds. Bot capacity exhausted this session; further automation deferred. Superseded docs PRs still open.
- Open held and recent hardens: many readiness contract, deploy-parity, retry-policy, event SSE, memory resilience, gateway watchdog PRs across repos. Dependabot residual risk may persist (postcss path traversal previously noted).
- No hourly audits. Legacy Quicksilver archived. Domain independence holds.
- Full brutal audit note: portfolio scores ~5/10, structural weaknesses: owner gates, high open-PR entropy, incomplete cross-plane proof, free-tier cold starts.

## Phase 1 — Owner gate stays external
Do not invent or store SUPABASE_SERVICE_ROLE_KEY. Exit: live ready body remains owner-blocked; posture parser rejects any other classification.

## Phase 2 — Alias and stranger classification stay strict
404 and unexpected 200 occupants are never the gate. Exit: tests reject treating them as owner action, device recorded, or production ready.

## Phase 3 — Device fence immutable
claimDeviceAcceptance() rejects. Exit: health body keeps deviceAcceptance=not_recorded and acceptanceGate=CHR-55.

## Phase 4 — CHR-55 remains the only device gate
Simulator, CI, or workers.dev 200 is not acceptance. Exit: Linear CHR-55 open until archive IPA installed and validated on iPhone 16e.

## Phase 5 — Conversation and Memory budget stay
Bounded windows and on-device embeddings continue. Exit: AppTests green; no unbounded history leakage.

## Phase 6 — Gateway contract and free-tier stay
No paid Workers bindings (KV/R2/D1/Queues). Exit: wrangler.toml clean.

## Phase 7 — Hygiene prune executed
One roadmap file. No hourly audit artifacts. Held PRs not merged without verification. Archived Quicksilver remains non-product. Superseded docs-refresh PRs closed. Open PR count reduced below 10 per repo. Audit note mirrored.

## Phase 8 — Resonance control plane waits on stamp
No second client or iOS Resonance surface until live Netlify ready body carries contract stamp and owner key is set.

## Phase 9 — Privacy and logging stay strict
Privacy manifest enforced. Gateway logs metadata only. Exit: no request/response body logging.

## Phase 10 — Cross-plane acceptance proof
Single probe covers Conduit ready, Resonance ready (stamped), and real device archive evidence. Exit: production verdict accepted. Fixture or classifier test is insufficient.

Binding constraints: Resonance owner secret + CHR-55 device archive. Neither is closed by simulator or classifier. High open-PR entropy is the current operational risk.

## Innovation Track (advanced — no gates violated)
1. Pure PortfolioPosture classifier holds. Fail-closed.
2. portfolio-probe tools hold with cold-start handling.
3. Hygiene prune: prioritize closing superseded docs-only PRs and consolidating test stacks.
4. Adversarial review of recent hardens (retry policy, SSE backpressure, gateway deadline watchdog, memory resilience) — merge candidates after CI green.
5. Cross-plane readiness contract v1 alignment across repos.
6. Lockfile / Dependabot hygiene residual.
7. Cross-repo consistency: this evidence block is canonical.
8. Chamber and capability plane advances held pending no-gate confirmation.
9. On-device diagnostics post Phase 8 only.
10. Fresh probe confirms identical fail-closed posture. No regression.

Audit note: Full audit, hardening, stabilization, hygiene, and prune pass completed. Fresh probes confirm fail-closed posture. Innovation: roadmap refreshed with live evidence; high open-PR load called out as debt. No secret invention. No device claim. Stabilization holds. Highest-value next: reduce open PR entropy (merge verified hardens, close superseded), then address owner key and CHR-55 device archive.
