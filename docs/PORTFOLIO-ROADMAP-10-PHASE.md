# Portfolio 10-phase roadmap — refreshed 2026-10-23 15:30 UTC (single snapshot; no addenda)

Supersedes the 2026-10-21 refresh. Addresses the CodeRabbit changes-requested review on closed #235
(defined merge-train PR class, single header timestamp, Phase 8 contract field, Phase 10 readiness vs device split).

## Evidence (2026-10-23, 15:01–15:30 UTC)
- Conduit `/ready`: **200** `status=ready`, version 0.8.0, `contractRevision=2026-10-03-ready-surface`, persistence postgres. Main CI green.
- Resonance `/api/ready`: **503** `not_ready`, `missingRequired=["SUPABASE_SERVICE_ROLE_KEY"]` (owner gate). Live body has **no `contractRevision`**, although `main` (`src/deploy/health.ts`) serializes `contractRevision` — production Netlify deploy lags main.
- Vercel aliases (portfolio-probe): resonance + quicksilver `stranger_occupant`, resonancenexus + quicksilverv1 `alias_absent` (DRIFT). Probe maturity score 3.3/10.
- Open PRs (start of pass → end): Conduit 28 → see PR body; Resonance 46 → see PR body; QuicksilverV1 17 (not touched; owned by Quicksilver Dev).
- Merged this pass: Conduit #258 (bridge total deadline), #213 (honest Workers 503); Resonance #236 (alias-drift check).
- No secrets invented. No device claim (CHR-55 open).

## Blunt scores (1-10)
| Repo | Security | Reliability | Tests | Hygiene | Ops |
|---|---|---|---|---|---|
| Conduit | 6 | 7 | 7 | 4 | 6 |
| Resonance | 6 | 3 | 6 | 2 | 3 |
| QuicksilverV1 | 5 | 5 | 6 | 4 | 4 |

Conduit: only live plane; grant/auth hardens (#234, #238, #206, #212) still unmerged and are the real security debt. No branch protection.
Resonance: not ready in prod (owner key), prod deploy behind main, 40+ PRs blocked on one human approval each.
QuicksilverV1: CI green; device acceptance unproven (CHR-55).

## Definitions
- **Merge-train PR class**: a green, non-overlapping hardening PR = CI-green on the required checks, current with `main`, touching no files shared with another queued PR, no unresolved valid review findings, adding no env vars, migrations, or auth/grant semantics.

## Phase 1 — Owner gate stays external
Never invent or store SUPABASE_SERVICE_ROLE_KEY. Exit: live ready body is owner-blocked until the owner sets the key; posture parser rejects other classifications.

## Phase 2 — Alias and stranger classification stay strict
404 and unexpected 200 occupants are never the gate. Exit: tests reject treating them as owner action, device recorded, or production ready. Alias drift is reported (#236), never auto-fixed.

## Phase 3 — Device fence immutable
claimDeviceAcceptance() rejects. Exit: health body keeps deviceAcceptance=not_recorded and acceptanceGate=CHR-55.

## Phase 4 — CHR-55 remains the only device gate
Simulator, CI, or workers.dev 200 is not acceptance. Exit: Linear CHR-55 open until archive IPA installed and validated on iPhone 16e.

## Phase 5 — Conversation and memory budget
Bounded windows, on-device embeddings. Exit: AppTests green; no unbounded history leakage.

## Phase 6 — Gateway contract and free tier
No paid Workers bindings. Exit: wrangler config clean; Workers entry returns honest 503 (Conduit #213, merged).

## Phase 7 — Hygiene prune (ADJUSTED: now the top priority)
Exit: open PRs < 10 per repo, using only the merge-train PR class above plus closing verifiably superseded or docs-only PRs with a comment. Resonance needs owner approvals: the behind-main PRs (#215, #187, #183, #175, #203, #198, #193) were brought current on 2026-10-23 and wait for approval.

## Phase 8 — Resonance control plane waits on stamp (ADJUSTED)
Contract decision: the Resonance `Readiness` response requires **`contractRevision` only**; `commitSha` is not part of the Resonance contract (Conduit #247 proposes it for Conduit only). Exit: live `GET /api/ready` returns `contractRevision` equal to `EXPECTED_CONTRACT_REVISION` (`2026-10-03-owner-gate`) — requires a redeploy of current main — and the owner key is set.

## Phase 9 — Privacy and logging stay strict
Exit: no request/response body logging; privacy manifest enforced.

## Phase 10 — Cross-plane acceptance (split)
- Readiness exit: one probe shows Conduit `/ready` 200 and Resonance `/api/ready` 200 with the stamped `contractRevision`. This is readiness evidence only.
- Device exit (tracked separately): CHR-55 archive IPA evidence (installed + validated on iPhone 16e). Readiness probes never satisfy this.

## Innovation track (free, no gates violated)
1. Probe jittered single cold-start retry, retries capped at 1 (Conduit #286).
2. Alias-drift report (landed, #236).
3. Next: cross-repo readiness-contract check — blocked until a schema is vendored in both repos (neither main has `schemas/readiness/v1.schema.json` today; Conduit #247 adds it to Conduit only).
4. Next: deploy-lag detector — compare live `/api/ready` keys with `main`'s `Readiness` type.
5. Stale-branch report (read-only).

## Owner gates
1. Set SUPABASE_SERVICE_ROLE_KEY in Netlify (Resonance) and redeploy main.
2. CHR-55 device IPA validation.
3. Approve the Resonance PRs brought current on 2026-10-23 (one review each).
4. Pick one of Conduit #204 / #267 / #283 (overlapping Bolt perf).
5. Decide Conduit auth/grants (#275, #276, #234, #238, #206, #212), DB TLS #155 (needs Render env), migrations #120.
