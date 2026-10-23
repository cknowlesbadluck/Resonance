# Portfolio 10-phase roadmap — refreshed 2026-10-23 16:20 UTC (single snapshot; no addenda)

Supersedes the 2026-10-21 refresh. Addresses the CodeRabbit changes-requested review on closed #235
(defined merge-train PR class, single header timestamp, Phase 8 contract field, Phase 10 readiness vs device split).

## Evidence (2026-10-23, 16:02–16:20 UTC, noon ET pass)
- Conduit `/ready`: **200** `status=ready`, version 0.8.0, `contractRevision=2026-10-03-ready-surface`, persistence postgres. Main `7d72554` CI, Live Smoke, Lockfile Sync green.
- Resonance `/api/ready` (resonancenexus.netlify.app): **503** `not_ready` (SUPABASE_SERVICE_ROLE_KEY missing; owner gate). resonanceplane.vercel.app/api/ready: **404 DEPLOYMENT_NOT_FOUND**. Prod deploy still behind main.
- QuicksilverV1 main `c2bfec7` CI green (read-only; owned by Quicksilver Dev). #370–#375 await owner merge OK.
- Open PRs (11:00 ET → 12:20 ET): Conduit 26 → 27 (+#287 innovation); Resonance 46 → 44; QuicksilverV1 17 → 17. No new Jules/bot PRs since 11:00 ET; nothing pruned.
- Merged this pass (normal merge on existing approval, green, current): Resonance #198 (gemini concurrency + ready privacy test), #203 (knip unused-export prune). Earlier today: Conduit #258, #213; Resonance #236.
- Brought current with main: Resonance #212, #200, #169, #157 (approved; merge once green). #193 held: valid P2 Codex finding (stale plan doc).
- New: Conduit #287 read-only journal-noise check (flags PRs touching only `.jules/*.md`), with tests.
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
3. Cross-plane consistency check exists as open #170; deploy-parity as #202/#179. Land those (after approval) instead of new duplicates. A schema-file diff is blocked: neither main has `schemas/readiness/v1.schema.json` (Conduit #247 adds it to Conduit only).
4. Deploy-parity (#202) would have caught today's live-vs-main `contractRevision` lag; prioritize its approval.
5. Stale-branch report (read-only).

## Owner gates
1. Set SUPABASE_SERVICE_ROLE_KEY in Netlify (Resonance) and redeploy main.
2. CHR-55 device IPA validation.
3. Approve the Resonance PRs brought current on 2026-10-23 (one review each).
4. Pick one of Conduit #204 / #267 / #283 (overlapping Bolt perf).
5. Decide Conduit auth/grants (#275, #276, #234, #238, #206, #212), DB TLS #155 (needs Render env), migrations #120.
