# Portfolio 10-phase roadmap — refreshed 2026-10-19 23:01 UTC (full audit + harden + stabilize + hygiene prune + innovate)

Live probes 2026-10-19T23:01Z:
- Conduit /ready: **200** stamped `{version:"0.8.0", contractRevision:"2026-10-03-ready-surface", persistence:"postgres"}`.
- Resonance /api/ready: **503** missing exactly `SUPABASE_SERVICE_ROLE_KEY`; production=true; persistenceConfigured=false; githubAdapterConfigured=false.
- Supabase projects remain INACTIVE (owner gate).
- Vercel aliases unchanged: stranger_occupant / alias_absent classifications hold.
- Open PR entropy remains high (Resonance ~50, Conduit ~33, QuicksilverV1 ~23). Hygiene prune of pure docs-audit notes is user-gated via close forms.
- No secrets invented. No device claim. Classifier ≠ production proof.

Brutal maturity: portfolio ~6.1/10. Dominant risks remain external owner gates + open-PR entropy. Stabilization holds; fail-closed posture confirmed again. No regression.

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
No paid Workers bindings (KV/R2/D1/Queues). Exit: wrangler.toml / equivalent clean.

## Phase 7 — Hygiene prune executed
One roadmap file. No hourly audit artifacts. Held PRs not merged without verification. Archived Quicksilver remains non-product. Superseded docs-refresh PRs targeted for close (user forms presented for #225 #226 Resonance, #270 Conduit). Open PR count target below 10 per repo via prioritized merge of green non-overlapping hardens and close of superseded/docs-only. Audit note mirrored across repos.

## Phase 8 — Resonance control plane waits on stamp
No second client or iOS Resonance surface until live Netlify ready body carries contract stamp and owner key is set.

## Phase 9 — Privacy and logging stay strict
Privacy manifest enforced. Gateway logs metadata only. Exit: no request/response body logging.

## Phase 10 — Cross-plane acceptance proof
Single probe covers Conduit ready (already true), Resonance ready (stamped), and real device archive evidence. Exit: production verdict accepted. Fixture or classifier test is insufficient.

Binding constraints: Resonance owner secret + CHR-55 device archive. Neither is closed by simulator or classifier. High open-PR entropy remains the current operational risk and must be pruned first.

## Innovation Track (advanced — no gates violated)
1. Pure PortfolioPosture classifier holds. Fail-closed.
2. portfolio-probe tools with cold-start backoff (retry on 503) — see Conduit #268.
3. Hygiene prune priority: close superseded docs-only PRs; use merge-train where available; merge only CI-green non-overlapping hardens.
4. Adversarial review of recent hardens continues.
5. Cross-plane readiness contract v1 alignment across repos.
6. Lockfile / Dependabot residual hygiene.
7. Cross-repo consistency: this evidence block is canonical; mirror key notes.
8. Chamber and capability plane advances held pending no-gate confirmation.
9. On-device diagnostics post Phase 8 only.
10. Fresh probe confirms identical fail-closed posture. No regression.
11. New: consolidate future audit notes into single living file updates rather than stacking pure docs PRs to reduce entropy.

Highest-value next: aggressively reduce open PR entropy (docs notes first via owner close), then owner gates (SUPABASE key + CHR-55 IPA). Stabilization holds. Innovate continues under constraints.
