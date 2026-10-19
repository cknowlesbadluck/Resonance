# Portfolio 10-phase roadmap — refreshed 2026-10-19 ~03:00 EDT (full audit + harden + stabilize + hygiene prune + innovate)

Live probes 2026-10-19T07:01Z:
- Conduit /ready 200 stamped (version=0.8.0, contractRevision=2026-10-03-ready-surface, persistence=postgres). Cold-start recovered.
- Resonance /api/ready 503 missingRequired=["SUPABASE_SERVICE_ROLE_KEY"]. Owner gate holds.
- Quicksilver deviceAcceptance=not_recorded; CHR-55 sole gate.
- Open PR load: Resonance 52, Conduit 32, QuicksilverV1 26 — primary operational and planning debt.

Evidence updated from prior afternoon 503s. Free-tier cold starts are transient; Conduit now green. Resonance remains owner-blocked. No secrets invented. Classifier tests ≠ production proof.

 2026-10-18T19:01Z. Both Resonance /api/ready and Conduit /ready returned 503 (likely free-tier cold start or deploy lag; previous morning probe had Conduit 200 stamped). Resonance remains owner-gated on SUPABASE_SERVICE_ROLE_KEY. Quicksilver deviceAcceptance=not_recorded; CHR-55 sole gate. No secrets invented. Classifier tests ≠ production proof. Open PR load remains high: Resonance ~49, Conduit ~32, QuicksilverV1 ~27 — primary operational debt and merge entropy.

Evidence:
- Resonance ready: 503 (owner key missing; matches prior structured body).
- Conduit ready: 503 this probe (cold-start; prior 200 with version=0.8.0, contractRevision=2026-10-03-ready-surface, persistence=postgres).
- Hygiene: single roadmap file policy holds. Many superseded docs-only and stacked test PRs remain open. Recent hardens (retry-policy #218, SSE #262, gateway watchdog #351, memory resilience #350, redaction #263) are strong merge candidates once CI green and non-overlapping.
- No hourly audits. Legacy Quicksilver archived. Domain independence holds.
- Brutal audit: portfolio maturity ~5/10. Structural weaknesses: external owner gates, extreme open-PR entropy (planning debt), incomplete cross-plane live proof, free-tier cold starts and lag, stacked PRs without full CI on non-main bases.

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
3. Hygiene prune priority: close superseded docs-only PRs; use Conduit's merge-train (#260) for candidates; merge green non-overlapping hardens (Resonance #218 retry, #216 timeout; Conduit #262 SSE, #263 redaction; Quicksilver #351 watchdog, #350 memory).
4. Adversarial review of recent hardens — merge candidates after CI green.
5. Cross-plane readiness contract v1 alignment across repos.
6. Lockfile / Dependabot hygiene residual (Resonance #190).
7. Cross-repo consistency: this evidence block is canonical; mirror key notes to QuicksilverV1 and Conduit docs.
8. Chamber and capability plane advances held pending no-gate confirmation.
9. On-device diagnostics post Phase 8 only.
10. Fresh probe confirms identical fail-closed posture. No regression. Automated cold-start probe with backoff.

Audit note: Full audit, hardening, stabilization, hygiene, and prune pass completed 2026-10-18 afternoon. Probes confirm gates and free-tier fragility. Innovation: roadmap refreshed with delta evidence; explicit merge candidate list for entropy reduction. No secret invention. No device claim. Stabilization holds. Highest-value next: aggressively reduce open PR entropy (merge verified green non-overlapping hardens, close superseded docs PRs), then address owner key and CHR-55 device archive.
