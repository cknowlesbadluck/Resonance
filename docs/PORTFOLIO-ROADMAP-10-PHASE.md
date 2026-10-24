# Portfolio 10-phase roadmap — refreshed 2026-10-24 03:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

Live probes 2026-10-24T03:00Z:
- Conduit /ready: **ready OK** (200 stamped, version 0.8.0, contractRevision 2026-10-03-ready-surface, persistence postgres). Warm.
- Resonance /api/ready: **not_ready FAIL** (exactly missing SUPABASE_SERVICE_ROLE_KEY; production true, authMode required ok, persistenceConfigured false). Timestamp 2026-10-24T03:00:41Z.
- Vercel aliases: resonance.vercel.app and quicksilver.vercel.app return 200 (stranger_occupant). Alias drift persists.
- Open PR entropy (current): QuicksilverV1 18, Conduit 27, Resonance 45. High entropy remains primary operational debt; hygiene prune ongoing.
- No secrets invented. No device claim (CHR-55 open). Classifier ≠ production proof.

Brutal maturity: portfolio ~6.2/10 overall. Dominant risks remain external owner gates (SUPABASE key + CHR-55 device IPA) + open-PR entropy. Stabilization holds; fail-closed posture confirmed. Scores: QS ~7.4, Conduit ~7.2, Resonance ~5.6.

## Phase 1 — Owner gate stays external
Do not invent or store SUPABASE_SERVICE_ROLE_KEY. Exit: live ready body remains owner-blocked; posture parser rejects any other classification.

## Phase 2 — Alias and stranger classification stay strict
404 and unexpected 200 occupants are never the gate. Exit: tests reject treating them as owner action, device recorded, or production ready. Drift on Vercel aliases noted.

## Phase 3 — Device fence immutable
claimDeviceAcceptance() rejects. Exit: health body keeps deviceAcceptance=not_recorded and acceptanceGate=CHR-55.

## Phase 4 — CHR-55 remains the only device gate
Simulator, CI, or workers.dev 200 is not acceptance. Exit: Linear CHR-55 open until archive IPA installed and validated on iPhone 16e.

## Phase 5 — Conversation and Memory budget stay
Bounded windows and on-device embeddings continue. Exit: AppTests green; no unbounded history leakage.

## Phase 6 — Gateway contract and free-tier stay
No paid Workers bindings (KV/R2/D1/Queues). Exit: wrangler.toml / equivalent clean.

## Phase 7 — Hygiene prune executed
One roadmap file. No hourly audit artifacts. Held PRs not merged without verification. Archived Quicksilver remains non-product. Superseded docs-refresh PRs targeted for close. Open PR count target below 10 per repo via prioritized merge of green non-overlapping hardens and close of superseded/docs-only. Audit note mirrored across repos. Current counts: 18/27/45.

## Phase 8 — Resonance control plane waits on stamp
No second client or iOS Resonance surface until live Netlify ready body carries contract stamp and owner key is set.

## Phase 9 — Privacy and logging stay strict
Privacy manifest enforced. Gateway logs metadata only. Exit: no request/response body logging.

## Phase 10 — Cross-plane acceptance proof
Single probe covers Conduit ready (already true), Resonance ready (stamped), and real device archive evidence. Exit: production verdict accepted. Fixture or classifier test is insufficient.

Binding constraints: Resonance owner secret + CHR-55 device archive. Neither is closed by simulator or classifier. High open-PR entropy remains the current operational risk and must be pruned first.

## Innovation Track (advanced — no gates violated)
1. Pure PortfolioPosture classifier holds. Fail-closed. Maturity score added to probe.
2. portfolio-probe tools with cold-start backoff (retry on 503) — landed.
3. Hygiene prune priority: close superseded docs-only PRs; use merge-train where available; merge only CI-green non-overlapping hardens.
4. Adversarial review of recent hardens continues.
5. Cross-plane readiness contract v1 alignment across repos.
6. Lockfile / Dependabot residual hygiene.
7. Cross-repo consistency: this evidence block is canonical; mirror key notes.
8. Chamber and capability plane advances held pending no-gate confirmation.
9. On-device diagnostics post Phase 8 only.
10. Fresh probe confirms identical fail-closed posture. No regression. Drift detections elevated priority for alias cleanup.

Highest-value next: aggressively reduce open PR entropy (docs notes first — close #239 Resonance, #290 Conduit if superseded; merge green non-overlapping like Conduit #283, QS #376), then owner gates (SUPABASE key + CHR-55 IPA). Stabilization holds. Innovate continues under constraints.
