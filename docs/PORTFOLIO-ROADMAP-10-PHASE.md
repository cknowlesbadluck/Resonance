# Portfolio 10-phase roadmap — refreshed 2026-10-19 ~01:00 EDT (full audit + harden + stabilize + hygiene prune + innovate)

Live probes 2026-10-19: Conduit /ready https://conduit-feco.onrender.com/ready returned 200 {status:ready, service:conduit, version:0.8.0, contractRevision:2026-10-03-ready-surface, persistence:postgres}. Resonance /api/ready on resonancenexus.netlify.app returned 503 (owner-gated missing SUPABASE_SERVICE_ROLE_KEY). QuicksilverV1 main CI green; deviceAcceptance=not_recorded; CHR-55 sole gate. No secrets invented. Classifier tests ≠ production proof. Open PR load remains primary debt: Resonance ~52, Conduit ~32, QuicksilverV1 ~26 — merge entropy and planning drag.

Evidence:
- Resonance ready: 503 (owner key missing; matches prior structured body). Free-tier cold start possible on other hosts.
- Conduit ready: 200 stamped (version=0.8.0, contractRevision=2026-10-03-ready-surface, persistence=postgres). Confirmed live.
- Hygiene: single roadmap file policy holds. Multiple near-duplicate docs-only audit PRs from 2026-10-19 (e.g. Resonance #220-#223, Quicksilver #355-#357, Conduit #264-#265) should be pruned by closing superseded ones. Recent hardens remain merge candidates once CI green and non-overlapping.
- No hourly audits. Legacy Quicksilver archived. Domain independence holds.
- Brutal audit: portfolio maturity ~5/10. Structural weaknesses: external owner gates (SUPABASE_SERVICE_ROLE_KEY, CHR-55 device IPA), extreme open-PR entropy (planning debt), incomplete cross-plane live proof, free-tier cold starts and lag, stacked PRs without full CI on non-main bases.

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
One roadmap file. No hourly audit artifacts. Held PRs not merged without verification. Archived Quicksilver remains non-product. Superseded docs-refresh PRs closed. Open PR count reduced below 10 per repo via prioritized merge of green non-overlapping hardens and close of superseded/docs-only. Audit note mirrored across repos.

## Phase 8 — Resonance control plane waits on stamp
No second client or iOS Resonance surface until live Netlify ready body carries contract stamp and owner key is set.

## Phase 9 — Privacy and logging stay strict
Privacy manifest enforced. Gateway logs metadata only. Exit: no request/response body logging.

## Phase 10 — Cross-plane acceptance proof
Single probe covers Conduit ready, Resonance ready (stamped), and real device archive evidence. Exit: production verdict accepted. Fixture or classifier test is insufficient.

Binding constraints: Resonance owner secret + CHR-55 device archive. Neither is closed by simulator or classifier. High open-PR entropy is the current operational risk and must be pruned first.

## Innovation Track (advanced — no gates violated)
1. Pure PortfolioPosture classifier holds. Fail-closed.
2. portfolio-probe tools hold with cold-start handling (retry on 503).
3. Hygiene prune priority: close superseded docs-only PRs (multiple 2026-10-19 audit notes); use merge-train where available; merge green non-overlapping hardens (Resonance retry/timeout, Conduit SSE/redaction, Quicksilver memory/watchdog).
4. Adversarial review of recent hardens — merge candidates after CI green.
5. Cross-plane readiness contract v1 alignment across repos (commitSha, stage, missingRequired names-only).
6. Lockfile / Dependabot hygiene residual.
7. Cross-repo consistency: this evidence block is canonical; mirror key notes to QuicksilverV1 and Conduit docs.
8. Chamber and capability plane advances held pending no-gate confirmation.
9. On-device diagnostics post Phase 8 only.
10. Fresh probe confirms identical fail-closed posture. No regression. Automated cold-start probe with backoff. Consider hygiene automation script for PR entropy detection.

Audit note: Full audit, hardening, stabilization, hygiene, and prune pass in progress 2026-10-19. Probes confirm Conduit stamped ready, Resonance owner-gated. Innovation: roadmap refreshed with live delta; explicit prune of duplicate docs PRs; highest-value next remains aggressive open PR entropy reduction, then owner key set and CHR-55 device archive evidence.
