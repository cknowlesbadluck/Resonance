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

## 21:00 ET refresh (2026-10-25 01:00Z)
- **Probes:** Conduit `/ready` 200 on the first try (0.8.0, `2026-10-03-ready-surface`, postgres). Resonance Netlify `/api/ready` 200 (production, authMode required, missingRequired []). Unauthenticated executions returned 401. `resonance.vercel.app` is still a third-party page (drift open).
- **Main CI:** Conduit green (CI, Live Smoke, portfolio-probe). QS green (14:29Z). Resonance shows only Gemini CLI "skipped" runs at the top.
- **Open PRs:** Conduit 20 → 22 (#315 classifier wiring stacked on #314, #316 roadmap refresh). Resonance 17. QS 13. 0 Dependabot alerts in all three repos (Resonance Dependabot PR #189 is still open).
- **Hygiene:** #313 review findings fixed (gate tests run in CI; a missing `# fail` line fails closed). The CodeRabbit CHANGES_REQUESTED reviews on #302/#305/#307 are stale: later commits address them and need a re-review. Nothing was closed: #384 is not yet folded into #390 (#390 lacks QUICKSILVER-ROADMAP-1.0.md, and QS is read-only), and #275 touches capability matching (security-adjacent).
- **Per-project roadmaps:** Conduit `docs/ROADMAP-10-PHASE.md` (Conduit #316). Resonance `docs/ROADMAP-10-PHASE.md` (this PR). The QS draft is held off-repo.
- **Scores:** QS 7.7, Conduit 7.6 (+0.1 for cold-start observability), Resonance 6.8.
- **CHR-55:** In Review in Linear, `not_recorded`. It gates phase 10.

## 02:00 ET refresh (2026-10-25 06:00Z)

**Evidence (live, unauthenticated, read-only):**
- Resonance `/api/ready`: 200 `ready`, production true, authMode `required`, missingRequired `[]`, posture `contract_passed`, contractRevision `2026-10-03-owner-gate`.
- Resonance fail-closed: `GET /api/nexus/executions` 401. `POST` with no auth: executions (with an Idempotency-Key) 401, intents 401, resume 401, events (valid UUID) 401, webhooks/github 401 (invalid signature). Requests without required fields get a 400 validation error before the auth check runs; nothing was accepted.
- Conduit `/ready`: 200 `ready` 0.8.0, `2026-10-03-ready-surface`, postgres, and now `production: true` (#311). Unauthenticated `/mcp` GET and POST return 401 `invalid_token`.

**Merges (Conduit only, squash):** #312 /ready timer leak, #311 `production` on /ready, #310 late audit docs, and #316 roadmap refresh (merged 06:10Z, `41dd797`, after CI went green on the conflict merge). Resonance: none, because merges need human approval.
**Skipped:** #317, #313 and #314 (CodeRabbit CHANGES_REQUESTED; #314 got it again after the branch update), #315 (stacked on #314), #308 (unresolved valid finding: keep revisions from not-ready responses), #309 (its own `trend` check fails).
**New:** Conduit #318 adds a `--auth-gate` probe flag: unauthenticated executions and /mcp must return 401/403.

**Owner gates (only these):**
1. QuicksilverV1: CHR-55 (device claim) is the only gate left.
2. Resonance migrations (#173, #207, #208, #214 lease): the owner applies them in Supabase. Agents never do.
3. Human review and approval: the Resonance queue and the Conduit auth backlog (#206, #212, #234, #238, #243). Bot approvals don't count.

**Innovations:**
1. **Shared lease wiring:** after the owner applies the #214 migration, switch fair share to the shared lease. Keep it opt-in, fall back to the in-process lease, and add a probe check that reports lease mode.
2. **Probe classifiers:** cold_start vs down (#314/#315), auth-gate (#318), revision skew (#308). Each is a pure function with a test, and each probe result carries a reason.
3. **Cross-plane health dashboard:** a static HTML page generated from `portfolio-probe --json` by a free Actions cron and published as an artifact or on Pages. No paid service and no secrets.

**10 phases (one line each):**
1. PR entropy down: ≤10 open PRs per repo, owner labels on anything older than 14 days.
2. Meaningful CI: remove Workers Builds noise and land the cancelled-tests gate.
3. Fail-closed auth: human-reviewed auth/RLS PRs plus an authz matrix test.
4. Bounded surface: timeouts, body caps, SSE caps, idempotent replays.
5. DB safety: owner-applied migrations, RLS static guard, TLS verify.
6. Observable probes: cold start, auth gate and revision skew classifiers on main.
7. Contract discipline: versioned /ready and MCP surface, with CI diff against docs.
8. Hygiene automation: scheduled read-only checklist and stale-branch report.
9. Cross-plane dashboard and shared leases (after the owner applies the migration).
10. 1.0: 30 days green, runbooks, and the CHR-55 device gate cleared for QS.

## 03:00 ET refresh (2026-10-25 07:00Z)

**Live probes (unauthenticated, read-only):**
- Conduit `/ready`, retried at t+0/10/20/30s (07:02:34–07:03:35Z): 200 `ready` on all 4 attempts (0.8.0, `2026-10-03-ready-surface`, postgres, production true). No cold start.
- Resonance `/api/ready` (07:03:36Z): 200 `ready`, production true, authMode `required`, missingRequired `[]`, posture `contract_passed`. The owner gate is cleared.

**Scores (owner rubric):** QS ~7.7, Conduit ~7.6, Resonance ~7.1, portfolio ~7.5. The 00:00 pass used a different rubric (6.7 / 6.5 / 6.2), so the two aren't comparable. Details are in `docs/AUDIT-2026-10-25.md`.

**Merges done at 02:00 (Conduit, squash):** #312 (`d2657ab`), #311 (`67f5626`), #310 (`88992d6`), #316 (`41dd797`).
**Merges this pass (Conduit, squash):** #309 entropy-trend gate (`0711a9d`), after its non-blocking trend check was fixed to warn instead of fail. #318 `--auth-gate` probe (`b72c7ec`). After this pass: QS 15 (#393 was opened by another agent at 07:03Z), Conduit 19, Resonance 18.
**Open PRs at 03:00 start:** QS 14, Conduit 20, Resonance 18. Nothing docs-only was strictly superseded, so no PRs were closed. QS #390's audit files and #384's roadmap don't exist on QS main and aren't covered by this audit.
**CHR-55:** still open / `not_recorded`. No device claim.
**Innovation:** Conduit stale-branch report gains restore commands (#319, read-only). Main's `--stale-branches` already handled open-PR/fork protection, the 14-day age cutoff, and squash-aware compare.

## 04:00 ET refresh (2026-10-25 08:00Z)

| # | Phase | Exit criteria | Status |
|---|---|---|---|
| 1 | Fail-closed edges | Every mutating or lookup route returns 401 before parsing the body. No raw DB or upstream text reaches clients. Provider calls have time bounds. | **In progress**: #243 (skills early-401) and #242 (time-to-headers plus the abort fix) are open. Waiting on #172/#174/#177. |
| 2 | Data-plane safety | RLS on every table (CI guard #241). SECURITY DEFINER search_path is set (#173). Null-project RLS is closed (#207). Live-vs-migration drift is checked (#196). | PRs open, and the owner applies the migrations |
| 3 | Error hygiene | Provider errors only map codes to messages. Stream idle timeout. Unified `persistenceErrorResponse`. | Next slice after #242 |
| 4 | Concurrency | Idempotent events (#209), resume guard (#206), shared fair-share leases (#214) | PRs open |
| 5 | CI integrity | CI on every base (#204). Actions SHA-pinned (#189). knip runs in CI as a warning. | Partial |
| 6 | Observability | Structured request IDs, a redacted evidence floor (#191), and a `/api/ready` drift alarm | Planned |
| 7 | Hygiene | Branches below 60. knip finds no unused files. `domain/types` pruned. | 303 branches. Candidates listed. |
| 8 | Adapters | Signed webhook adapter. GitHub adapter configured in prod. | Planned |
| 9 | Chambers UX | Compose and explain, plus a policy-gate UI | Planned |
| 10 | 1.0 | Every phase's exit criteria met, plus an SLO and a runbook | — |

**Innovations:** a route-auth matrix test that enumerates `app/api/**/route.ts` and asserts 401-first. Provider error code tables. An SSE idle watchdog shared by the 3 adapters.
**Next slice:** land #242, stack (b) and (c) on it, then merge the #172/#174/#177 trio (owner).
