# Portfolio 10-phase roadmap — refreshed 2026-10-21 23:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

Live probes and current state (as of 2026-10-21):
- Conduit /ready: 200 stamped.
- Resonance /api/ready: 503 missing SUPABASE_SERVICE_ROLE_KEY (owner gate, do not invent).
- Open PR entropy high (~20-50 across active repos). Hygiene prune priority: close superseded docs-only PRs.
- Portfolio maturity ~5.5-6.0/10. Dominant risks: owner gates (SUPABASE + CHR-55 device IPA) + PR entropy.
- Stabilization holds. Fail-closed posture confirmed.

## Phase 1 — Owner gate stays external
Do not invent or store SUPABASE_SERVICE_ROLE_KEY. Exit: live ready body remains owner-blocked.

## Phase 2 — Alias and stranger classification stay strict
404 and unexpected 200 occupants are never the gate.

## Phase 3 — Device fence immutable
claimDeviceAcceptance() rejects. deviceAcceptance=not_recorded.

## Phase 4 — CHR-55 remains the only device gate
Simulator/CI not acceptance. Linear CHR-55 open until real iPhone 16e IPA validation.

## Phase 5 — Conversation and Memory budget stay
Bounded windows, on-device embeddings.

## Phase 6 — Gateway contract and free-tier stay
No paid Workers bindings.

## Phase 7 — Hygiene prune executed
Close superseded docs PRs. Target open PRs <10 per repo. One canonical roadmap.

## Phase 8 — Resonance control plane waits on stamp
No second client until live ready stamped.

## Phase 9 — Privacy and logging stay strict
No body logging. Privacy manifest enforced.

## Phase 10 — Cross-plane acceptance proof
Single probe: Conduit ready + Resonance ready + real device evidence.

## Innovation Track
1. Aggressive PR entropy reduction (docs first).
2. Cross-plane readiness contract alignment.
3. Adversarial review of hardens.
4. Lockfile/Dependabot hygiene.
5. Chamber/capability advances only under no-gate confirmation.
6. On-device diagnostics post Phase 8.
7. Portfolio probe maturity scoring live.
8. Fail-closed classifier holds.
9. Mirror audit notes across repos.
10. Fresh probes for regression check.

Highest-value next: prune open PR entropy, then owner gates. Innovate under constraints. No secrets invented. No device claims.
