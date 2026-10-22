# Portfolio 10-phase roadmap — refreshed 2026-10-22 13:00 EDT (full audit + harden + stabilize + hygiene prune + innovate)

Live probes 2026-10-22T17:00Z approx:
- Conduit /ready: **ready OK** (HTTP 200, version 0.8.0, contractRevision 2026-10-03-ready-surface, persistence postgres). Confirmed.
- Resonance /api/ready: **not_ready FAIL** (HTTP 503, missingRequired SUPABASE_SERVICE_ROLE_KEY only — known owner gate. Do not invent or store the key).
- Open PR entropy: QuicksilverV1 ~22 remaining after prune, Conduit ~35, Resonance reduced after closing superseded docs notes. Hygiene continues.
- No secrets invented. No device claim (CHR-55 open). Classifier ≠ production proof. Stabilization holds; fail-closed confirmed.

Brutal maturity: portfolio ~5.8-6.2/10 overall. Dominant risks: owner gates (SUPABASE key + CHR-55 device IPA on real iPhone) + residual open-PR entropy. Architecture solid across planes. Probe maturity tracking live.

## Phase 1 — Owner gate stays external
Do not invent or store SUPABASE_SERVICE_ROLE_KEY. Exit: live ready body remains owner-blocked; posture parser rejects any other classification.

## Phase 2 — Alias and stranger classification stay strict
404 and unexpected 200 occupants are never the gate. Exit: tests reject treating them as owner action, device recorded, or production ready. Drift on Vercel aliases noted; prioritize cleanup when safe.

## Phase 3 — Device fence immutable
claimDeviceAcceptance() rejects. Exit: health body keeps deviceAcceptance=not_recorded and acceptanceGate=CHR-55.

## Phase 4 — CHR-55 remains the only device gate
Simulator, CI, or workers.dev 200 is not acceptance. Exit: Linear CHR-55 open until archive IPA installed and validated on iPhone 16e.

## Phase 5 — Conversation and Memory budget stay
Bounded windows and on-device embeddings continue. Exit: AppTests green; no unbounded history leakage.

## Phase 6 — Gateway contract and free-tier stay
No paid Workers bindings (KV/R2/D1/Queues). Exit: wrangler.toml / equivalent clean.

## Phase 7 — Hygiene prune executed
One roadmap file. No hourly audit artifacts. Held PRs not merged without verification. Archived Quicksilver remains non-product. Superseded docs-refresh PRs closed (Resonance #228/#229/#230, Conduit #271/#273, QS #360/#361). Open PR count target below 10-15 per repo via prioritized merge of green non-overlapping hardens and continued close of pure notes. Audit note mirrored.

## Phase 8 — Resonance control plane waits on stamp
No second client or iOS Resonance surface until live Netlify ready body carries contract stamp and owner key is set.

## Phase 9 — Privacy and logging stay strict
Privacy manifest enforced. Gateway logs metadata only. Exit: no request/response body logging.

## Phase 10 — Cross-plane acceptance proof
Single probe covers Conduit ready (already true), Resonance ready (stamped), and real device archive evidence. Exit: production verdict accepted. Fixture or classifier test is insufficient.

Binding constraints: Resonance owner secret + CHR-55 device archive. Neither is closed by simulator or classifier. High open-PR entropy remains operational risk; prune continues aggressively.

## Innovation Track (advanced — no gates violated)
1. Pure PortfolioPosture classifier holds. Fail-closed. Maturity score in probe.
2. portfolio-probe tools with cold-start backoff (retry on 503) — landed.
3. Hygiene prune priority: close superseded docs-only PRs (executed this pass); use merge-train where available; merge only CI-green non-overlapping hardens.
4. Adversarial review of recent hardens continues.
5. Cross-plane readiness contract v1 alignment across repos.
6. Lockfile / Dependabot residual hygiene (Resonance #233 minor-and-patch group open).
7. Cross-repo consistency: this evidence block is canonical; mirror key notes.
8. Chamber and capability plane advances held pending no-gate confirmation.
9. On-device diagnostics post Phase 8 only.
10. Stale branch detector (Conduit #278) for further prune. Fresh probe confirms identical fail-closed posture. No regression.

Highest-value next: continue aggressive PR entropy reduction (merge green Bolt/hardens where non-overlapping and CI green; close more notes), then owner gates (SUPABASE key + CHR-55 IPA). Stabilization holds. Innovate continues under constraints.
