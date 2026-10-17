# Portfolio 10-phase roadmap — 2026-10-17 (full audit + harden + stabilize + hygiene prune + innovate)

Live probes at 2026-10-17T14:00Z. Conduit /ready 200 (v0.8.0, postgres). Resonance /api/ready 503 (missing SUPABASE_SERVICE_ROLE_KEY). Quicksilver CHR-55 not_recorded. No secrets invented. No device claims. Classifier/tests ≠ production proof.

Evidence:
- Conduit ready 200 stamped.
- Resonance not_ready 503 missingRequired [SUPABASE_SERVICE_ROLE_KEY], health ok, deploy lag.
- Supabase inactive. Vercel stranger/absent. Quicksilver CI green, device gate open.
- Open PR volume high (~100+ across three). Non-runtime merges holding ready.

## Phase 1 — Owner gates stay external and fail-closed
Do not invent secrets. Exit: Resonance ready body remains owner-blocked on missing key; Conduit ready 200; posture rejects incomplete.

## Phase 2 — Alias and stranger classification stay strict
404/unexpected 200 never treated as owner action or ready. Exit: probes and tests enforce.

## Phase 3 — Device fence immutable
claimDeviceAcceptance() rejects. Exit: health keeps deviceAcceptance=not_recorded, acceptanceGate=CHR-55.

## Phase 4 — CHR-55 remains the only device gate
Simulator/CI/workers.dev ≠ acceptance. Exit: Linear CHR-55 open until archive IPA on iPhone 16e validated.

## Phase 5 — Conversation and Memory budget stay
Bounded windows, on-device embeddings, retention. Exit: AppTests green; no unbounded leakage.

## Phase 6 — Gateway contract and free-tier stay
No paid bindings. Exit: wrangler.toml and routing clean; privacy floor holds.

## Phase 7 — Hygiene prune executed
One roadmap + one current audit per repo. Close superseded stacked PRs after verification. No hourly artifacts. Archived non-product.

## Phase 8 — Resonance control plane waits on stamp
No second client or iOS surface until live ready carries contract stamp and owner key set. Deploy lag resolved by owner lock or manual.

## Phase 9 — Privacy and logging stay strict
Privacy manifests, redaction, metadata-only logs, no body logging. Exit: tests pin floors.

## Phase 10 — Cross-plane acceptance proof
Single probe covers Conduit ready, Resonance ready (stamped), real device archive evidence. Exit: production verdict accepted. Fixture insufficient.

Binding constraints: Resonance owner secret + CHR-55 device archive. Neither closed by simulator or classifier.

## Innovation Track (advanced — no gates violated)
1. Durable execution journal contract (in-memory + RFC) for approve/resume survival — Resonance #215.
2. Policy dry-run / explain endpoint for capabilities (allow/approval/deny + reasons) — Resonance #217.
3. Shared leases for fair-share across instances (opt-in, fail-safe) — Resonance #214.
4. Task stale-claim recovery (task_reclaim) + health summary — Conduit #259.
5. Signed HMAC-chained grant receipts for mcp_bridge_call (opt-in, offline verifier) — Conduit #257.
6. Bridge destination rule (allowlist/registered, report default, enforce opt-in) — Conduit #256.
7. Total wall-clock deadlines + outbound timeout guards across planes — Resonance #216, Conduit #258.
8. On-device note summaries and VoiceOver state announcements (Quicksilver PRs).
9. Calibrated personal classifier + history prune for cloud fallback (privacy-preserving).
10. Fresh 14:00Z probe confirms identical fail-closed posture. No regression.

Audit notes: Full audit, hardening, stabilization, hygiene, and prune pass completed. Fresh probes confirm postures. Innovations proposed and partially implemented in open PRs. Highest-value next: owner sets Resonance key + restores DB; validate Quicksilver device archive (CHR-55); land non-conflicting hardening PRs. Stabilization holds.
