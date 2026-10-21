# Portfolio 10-phase roadmap — refreshed 2026-10-21 15:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

Live state as of 2026-10-21 ~15:00Z:
- QuicksilverV1 main CI: green (last push success). Open PRs ~24, open issues ~26. Aspect architecture solid, on-device first, SideStore path ready. Device gate CHR-55 open.
- Resonance: open PRs ~50, issues ~53. /api/ready 503 missing SUPABASE_SERVICE_ROLE_KEY (owner gate). Capability plane convergence in progress. Fail-closed.
- Conduit: open PRs ~34, issues ~36. /ready 200 stamped. Bolt optimizations landing (pattern match, actor binding). Fail-closed auth.
- Portfolio maturity: ~5.8/10 (stabilized, high PR entropy is main operational drag; external gates block full ready).
- No secrets, no invented keys. Hygiene: many redundant docs PRs from repeated audits.

Brutal assessment: Architecture holds (Sense-Think-Express, modular Core, fail-closed). Technical debt is open PR volume and incomplete owner gates. Fragile: Resonance ready without key; Quicksilver device acceptance. Tests exist (SPM, vitest). Assumptions: free-tier only, public Apple APIs, SideStore.

## Phase 1 — Owner gate stays external
Do not invent or store SUPABASE_SERVICE_ROLE_KEY. Exit: live ready body remains owner-blocked; posture parser rejects any other classification.

## Phase 2 — Alias and stranger classification stay strict
404 and unexpected 200 occupants are never the gate. Exit: tests reject treating them as owner action, device recorded, or production ready. Drift on Vercel aliases noted and prioritized for cleanup.

## Phase 3 — Device fence immutable
claimDeviceAcceptance() rejects. Exit: health body keeps deviceAcceptance=not_recorded and acceptanceGate=CHR-55.

## Phase 4 — CHR-55 remains the only device gate
Simulator, CI, or workers.dev 200 is not acceptance. Exit: Linear CHR-55 open until archive IPA installed and validated on iPhone 16e.

## Phase 5 — Conversation and Memory budget stay
Bounded windows and on-device embeddings continue. Exit: AppTests green; no unbounded history leakage.

## Phase 6 — Gateway contract and free-tier stay
No paid Workers bindings (KV/R2/D1/Queues). Exit: wrangler.toml / equivalent clean.

## Phase 7 — Hygiene prune executed
One roadmap file. No hourly audit artifacts. Held PRs not merged without verification. Archived Quicksilver remains non-product. Superseded docs-refresh PRs closed aggressively. Open PR count target below 15 per repo via prioritized merge of green non-overlapping hardens (Bolt, tests, resume guards) and close of docs-only duplicates. Audit note mirrored across repos.

## Phase 8 — Resonance control plane waits on stamp
No second client or iOS Resonance surface until live ready body carries contract stamp and owner key is set.

## Phase 9 — Privacy and logging stay strict
Privacy manifest enforced. Gateway logs metadata only. Exit: no request/response body logging.

## Phase 10 — Cross-plane acceptance proof
Single probe covers Conduit ready (already true), Resonance ready (stamped), and real device archive evidence. Exit: production verdict accepted. Fixture or classifier test is insufficient.

Binding constraints: Resonance owner secret + CHR-55 device archive. Neither is closed by simulator or classifier. High open-PR entropy remains the current operational risk and must be pruned first.

## Innovation Track (advanced — no gates violated)
1. Pure PortfolioPosture classifier holds. Fail-closed. Maturity score live in probe.
2. portfolio-probe tools with cold-start backoff — landed.
3. Hygiene prune priority: close superseded docs-only PRs immediately; merge CI-green Bolt hardens and consolidated tests.
4. Adversarial review of recent hardens continues (resume body bounds, capability fast-paths).
5. Cross-plane readiness contract v1 alignment across repos.
6. Lockfile / Dependabot residual hygiene.
7. Cross-repo consistency: this evidence block is canonical; mirror key notes to QuicksilverV1 and Conduit.
8. Chamber and capability plane advances held pending no-gate confirmation.
9. On-device diagnostics post Phase 8 only.
10. Fresh probe confirms identical fail-closed posture. No regression. Innovate: add automated PR entropy dashboard in probe; prioritize non-overlapping green PRs for merge train.

Highest-value next: aggressively prune open PR entropy (close docs duplicates first, merge green hardens), then resolve owner gates (SUPABASE key + CHR-55 IPA). Stabilization holds. Innovate under constraints: quantitative maturity tracking + automated hygiene.
