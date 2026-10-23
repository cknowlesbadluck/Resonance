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

## Evidence 2026-10-23 13:03 EDT (17:03Z)
- Conduit `/ready` 200 (`contractRevision` 2026-10-03-ready-surface, persistence postgres); Resonance `/api/ready` 503, `missingRequired: [SUPABASE_SERVICE_ROLE_KEY]` (owner gate). Open PRs: Resonance 44, Conduit 26; no merges this pass.
- CHR-55 still open: no device acceptance recorded.
- Bot-approval finding: every APPROVED Resonance PR (#157, #169, #193, #200, #212) is approved only by `coderabbitai`. Bot-only approvals do not count; each needs a human review before merge.

## Evidence 2026-10-23 17:05 EDT (21:05Z)
- Probes: Conduit `/ready` 200 (0.8.0, `contractRevision` 2026-10-03-ready-surface, postgres). Resonance `/api/ready` 503, `missingRequired: [SUPABASE_SERVICE_ROLE_KEY]` (owner gate, unchanged). Probe score 3.3/10 (Vercel aliases still stranger/absent).
- Main CI green on all three repos (QuicksilverV1 CI 19:01Z, Conduit CI 16:19Z, Resonance CI 16:10Z). Conduit `Workers Builds` is a known always-failing check and is ignored.
- Open PRs: QuicksilverV1 18, Conduit 26 → 27 (adds #288), Resonance 44. No merges or closes this pass:
  - Conduit #283 (Bolt fast path) is green but CONFLICTING and 13 commits behind main, so it was not merged. #204/#267 stay open.
  - Every approved Resonance PR is approved only by a bot, so none were merged.
  - No docs-only PR was verifiably superseded.
- Scores unchanged from the table above (Conduit 6/7/7/4/6, Resonance 6/3/6/2/3, QuicksilverV1 5/5/6/4/4).
- Exit criteria: fail-closed holds (Resonance 503 names only the missing key; no secret echoed). No owner gate was bypassed. CHR-55 is still the only device gate, and this pass makes no device claim.
- Innovation: Conduit #288 adds `portfolio-probe --decisions`, a read-only owner decision queue (6 tests, no new dependencies).
- Decision queue (live 21:04Z; categories overlap):
  - Conduit: 22/26 blocked. Bot-only approval: #238, #267. Changes requested: 13. Adds env vars: 13. Auth/grants/migrations: #120, #155, #206, #211, #238, #243, #251, #276. Behind main: #119, #120, #275, #276, #283.
  - Resonance: 37/44 blocked. Bot-only approval: #157, #169, #193, #200, #212. Changes requested: 10. Adds env vars: 11. Auth/RLS/migrations: 11. Behind main: 33.
  - QuicksilverV1: 0 flagged (GitHub reported merge state UNKNOWN; read-only here, owned by Quicksilver Dev).

## Evidence 2026-10-23 18:02 EDT (22:02Z)
- Probes: Conduit `/ready` 200 (0.8.0, `contractRevision` 2026-10-03-ready-surface, postgres). Resonance `/api/ready` 503, `missingRequired: [SUPABASE_SERVICE_ROLE_KEY]` (owner gate, unchanged; no secret echoed).
- Main CI green on all three repos. Conduit `Workers Builds` is a known always-failing check and is ignored.
- Open PRs: QuicksilverV1 18, Conduit 27, Resonance 44. No merges or closes this pass:
  - Conduit #288 still carries CodeRabbit CHANGES_REQUESTED (re-review was rate-limited). Every finding has a fix commit (f47cacf, 84e7f9a), so it waits for the bot to re-review.
  - Every approved Resonance PR (#157, #169, #193, #200, #212) is approved only by a bot, so none were merged.
- Dependabot: the critical/high `next` alerts are fixed by #233, which is waiting on human review (REVIEW_REQUIRED).
- CHR-55 is still the only device gate, and this pass makes no device claim.
- Innovation: #288 now has a read-only `--stale-branches` mode (no open PR, no commit in 14+ days; never deletes). Live result at 22:02Z: none stale in any repo, since every branch is less than 14 days old. The `adds_env_vars` heuristic now flags only `.env.example` additions and new `process.env` reads in non-test `src/` files, so Resonance drops from 11 flagged PRs to 1 (#210).

## Evidence 2026-10-23 19:00 EDT (23:00Z)
- Probes unchanged: Conduit `/ready` 200; Resonance Netlify `/api/ready` 503 (SUPABASE_SERVICE_ROLE_KEY owner gate). `resonanceplane.vercel.app` returns 404 DEPLOYMENT_NOT_FOUND (alias drift, already flagged by the probe).
- Main CI green on all three. Open PRs: QuicksilverV1 18 (new #378, read-only for us), Conduit 27, Resonance 44. No merges or closes.
- Conduit #288: CodeRabbit's 2 new findings on 84e7f9a (short env names; branches heading cross-repo PRs) fixed in 50c0783 with tests; CI green. Re-review is rate-limited again, so CHANGES_REQUESTED stands and #278 stays open.
- Live stale-branch run: one stale branch, Resonance `hygiene/probe-2026-10-09-2300` (14d). Report-only, nothing deleted.
- CHR-55 is still the only device gate.
