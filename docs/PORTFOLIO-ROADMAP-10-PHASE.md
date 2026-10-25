# Portfolio 10-phase roadmap to 1.0, refreshed 2026-10-24 20:00Z (16:00 ET, evening)

Scope: Conduit (MCP bridge), Resonance (Nexus), QuicksilverV1 (iOS). Projects stay separate; this file only tracks gates.
Tags: [passed] means exit criteria met with evidence from this pass. [in progress] means work is open. [blocked] means it needs the owner or an external input.
Evidence: docs/AUDIT-2026-10-24.md ("Evening 2026-10-24 (16:00 ET)" section).

| # | Phase | Exit criteria | Status |
|---|-------|---------------|--------|
| 1 | Ready / contract consistency | Conduit /ready 200; Resonance /api/ready 200 with authMode required; unauthenticated /api/nexus/executions returns 401 | [passed] 20:01Z (Conduit 200 0.8.0; Resonance 200, authMode required; executions 401) |
| 2 | Dependabot zero | Open alerts = 0 in all 3 repos (Conduit 1 high until the rescan, Resonance 0, QS 0) | [in progress] Conduit #306 merged (body-parser 2.4.0), but 1 alert was still open at 20:01Z, pending the rescan. Resonance 0. |
| 3 | Main protection | PR-only main with required checks in all repos; no direct pushes | [blocked] owner must enable rulesets |
| 4 | PR entropy under 25 per repo, hygiene target under 10 | Evening prune: Resonance 41 → 17, Conduit 25 → 13 before the probe merges; QS 17 is read-only | [in progress] Conduit is near the target. The rest of the Resonance count is security, migration, or owner-gated PRs that need a human review |
| 5 | Branch prune with proof | Delete only when the PR is closed or merged and the branch has no unique content vs main (squash-aware); log name and SHA | [passed] 15 Conduit branches pruned 13:05Z with SHAs logged; Resonance had 0 eligible |
| 6 | Public-API guards and timeouts | Every public input is bounded; every outbound fetch has a deadline; config typos fail safe | [in progress] Conduit #303 and #304 merged (rate-limit NaN guard, X-Request-Id validation); Resonance #206 #174 #200 #185 #172 #177 await human review (#205 and #216 were closed as stale) |
| 7 | Durable journal completion | Resonance execution journal is persisted (not in-memory); approve and resume are idempotent across restarts; replay test passes | [in progress] #215 was closed as stale in the evening prune (its branch is kept). Re-scope with a persisted design plus an owner-applied migration |
| 8 | Fair-share scheduling | Per-project and per-adapter in-flight caps hold across instances; starvation test passes | [in progress] #214 (stacked; carries the #213 commits; migration NOT applied; conflicting, needs a rebase) |
| 9 | MCP bridge receipt enforcement | Every mcp_bridge_call emits a signed, chained receipt; offline verifier is in CI; destination allowlist goes from report-only to enforce | [in progress] Conduit #257 receipts and #256 allowlist were closed as stale (44 commits behind; branches kept). Reopen and rebase when the owner prioritises this |
| 10 | 1.0 acceptance | Portfolio probe maturity at least 8/10 for 7 days; Vercel alias drift resolved; QS on-device intelligence polish shipped; CHR-55 device fence evidence recorded | [blocked] see below; alias drift still live (resonance.vercel.app = third-party), detected by Conduit #305; tool-surface discovery is Conduit #307 |

## Innovation track
- **Durable journal completion** (Resonance, phase 7): [in progress] (#215 closed stale; re-scope). Exit: persisted journal plus a crash/replay test.
- **Fair-share scheduling** (Resonance, phase 8): [in progress]. Exit: cross-instance lease test, fail-safe when the lease store is down.
- **On-device intelligence polish** (QuicksilverV1): [in progress]. QS #345/#348 (on-device summaries, no cloud fallback), #340 (classifier corpus), #319 (NL privacy gate). Exit: held-out classifier metrics published and summaries behind the privacy seam. Read-only from this pass.
- **MCP bridge receipt enforcement** (Conduit, phase 9): [in progress]. Exit: enforce mode on by owner decision; verifier runs in CI.
- **CHR-55 device fence**: [blocked], status not_recorded. No device evidence exists in this pass and no device claims are made. Exit: owner-recorded on-device run.

## Alias-drift cleanup (phase 10)
Detection is live: Conduit #305 `--alias-drift` and Resonance #236. The owner chooses one of two options: attach a project-owned Vercel alias, or retire `resonance.vercel.app` from docs and probes and keep Netlify canonical. Exit: the probe reports resonance or absent for 7 days.

## Evening triage summary (16:00 ET)
Resonance: 26 closed, 17 open (living docs, RLS/migration, security fail-closed, deps). Conduit: 12 closed, plus the probe merges #302, #305 and #307 when they are eligible. Nothing in Resonance was merged because it had no human approval.

## Owner-only gates
Branch protection; Dependabot/next upgrade review; all migrations (#214, #208, #207, #173, Conduit #120); Conduit auth/grants PRs (#206 #212 #234 #238 #275), #155 DB TLS, #209 trust proxy; choosing one of Conduit #204/#267/#283; Vercel alias decision; Render plan (cold start).

## Late 2026-10-24 evidence (22:00Z)
See [AUDIT-2026-10-24-LATE.md](AUDIT-2026-10-24-LATE.md).
- Both planes are ready. Resonance reports production=true. The unauthenticated executions request returns 401.
- Open PRs: QuicksilverV1 12, Resonance 17 (down from 41), Conduit 14 (down from 25). CI on main is green in all three repos.
- Innovation slices: (a) entropy-trend baseline gate (Conduit #309); (b) stricter stale-branch safe-delete with restore commands; (c) consistency assertion for the contractRevision format and production=true on both planes.

## 19:00 ET refresh (2026-10-24 23:00Z)
Trackers (read-only references, Linear not edited): **Resonance Integration Platform** (Resonance and Conduit phases 1-9) and **Mercury: Quicksilver** (QS work; device phases gated on CHR-55).

| # | Phase | Goal | Exit criteria | Status 23:00Z |
|---|-------|------|---------------|---------------|
| 1 | Ready / contract consistency | Both planes self-describe | Both /ready 200, Resonance authMode required, executions 401, both report `production=true` | [in progress] probes pass; Conduit `production` field is Conduit #311 |
| 2 | Dependabot zero | No open alerts | 0 alerts in all 3 repos | [in progress] Conduit alert #1 still open, but `npm ls body-parser` on main shows only 2.4.0 (patched). Stale alert, no fix PR needed; it closes on the rescan |
| 3 | Main protection | PR-only main | Rulesets with required checks | [blocked] owner |
| 4 | PR entropy | Fewer open PRs | Under 10 per repo; entropy-trend steady for 7 days | [in progress] Conduit 18, Resonance 17, QS 13. Non-blocking entropy-trend CI job pushed to #309 |
| 5 | Branch prune with proof | Safe deletes | Squash-aware with SHAs logged; stricter variant (no fork PR, older than 3 days, restore cmds) | [passed] base; stricter variant not started |
| 6 | Guards and timeouts | Bounded inputs and deadlines | Every probe and outbound call has a deadline, with no leaked timers | [in progress] Conduit #312 clears the /ready probe timer |
| 7 | Durable journal | Persisted execution journal | Crash/replay test | [in progress] re-scope (#215 closed) |
| 8 | Fair-share scheduling | Cross-instance caps | Starvation test | [in progress] #214 (migration owner-gated) |
| 9 | Receipt enforcement | Signed, chained MCP receipts | Verifier in CI, allowlist set to enforce | [in progress] parked (#256 and #257 branches kept) |
| 10 | 1.0 acceptance | Portfolio stable | Probe maturity at least 8/10 for 7 days, alias drift resolved, CHR-55 recorded | [blocked] CHR-55 not_recorded; resonance.vercel.app still third-party |

Innovations this pass: (a) entropy-trend as a continue-on-error CI job (#309); (b) additive Conduit `/ready.production` (#311); (c) stricter stale-branch safe-delete: proposed, not built.
QS device phases (on-device intelligence polish, SideStore IPA) stay [blocked] on CHR-55 evidence.

## 20:00 ET refresh (2026-10-25 00:00Z)
- Phase 1: [passed] both planes are ready and executions returns 401. Conduit `production` is still pending in #311 (approved and ready to merge).
- Phase 2: **[passed]**. Conduit body-parser alert #1 was fixed on rescan, and all 3 repos show 0 open alerts.
- Phase 4: [in progress] Conduit 20, Resonance 17, QS 13. QS #389 is closed (superseded by #390), and the next step is to fold #384 into #390.
- Phase 6: [in progress] #312 is ready to merge. New: Conduit #313 is a CI gate that fails on cancelled tests.
- Phase 10: [blocked] CHR-55 is not_recorded, and alias drift continues.
- Scores: QS 7.7, Conduit 7.5, Resonance 6.8 (category table in AUDIT-2026-10-24-LATE.md).
- Innovations: (a) cancelled-test gate (#313); (b) cold_start vs down classifier (#314), to be wired into portfolio-probe after #305-#309 land; (c) stricter stale-branch safe-delete: not built this pass.
