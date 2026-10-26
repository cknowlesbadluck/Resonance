# Portfolio 10-phase roadmap to 1.0 (living; refreshed 2026-10-25 08:00 ET / 12:00Z)

Projects stay separate (identity, credentials, backlog, release path). This file only tracks gates. Evidence: docs/AUDIT-2026-10-25.md, "08:00 ET pass".

### Living status (2026-10-26 00:05 ET; canonical evidence: [AUDIT-2026-10-26.md](AUDIT-2026-10-26.md))

| Project | Readiness | CI (main) | Open PRs | Assess (overall /10) | Top gate | Next slice |
|---|---|---|---|---|---|---|
| Conduit | /ready 200 production on Postgres, v0.8.0 (00:02 ET) | green d44b971; no direct pushes since 19:10 ET | 15 (incl. #333) | 7.1 | CodeRabbit re-review of #323/#326/#328/#332; 9 owner-only PRs | merge #332 → #328 once reviews clear |
| Resonance | /api/ready 200 contract_passed; unauthenticated POST executions **400** (not 401) | green e01421d | 23 | 6.1 | human merge of #243 → #244 → #246 | then trim the transitional entries in #245/#248 |
| QuicksilverV1 | iOS; CHR-55 `not_recorded` | green 8042e05 (a344a8d running) | 20 | 6.0 | CHR-55 device run (owner); 8 single-file guard PRs awaiting Quicksilver Dev | merge the non-overlapping guard tier (see audit 22:00 ET) |

Note: main's 14:00Z and 18:01Z refreshes of this file (b032f57, e01421d) was superseded on merge by this living version. See also AUDIT-2026-10-25-LATE.md.

### Phases (exit criteria)

| # | Phase | Exit criteria | Status |
|---|---|---|---|
| 1 | Contract consistency | Both /ready 200 with `production` true; probe schemas match the emitted body (parity test) | [passed] Conduit #324 adds the parity test; Resonance parity exists |
| 2 | Fail-closed edges | Every unauthenticated route returns 401 before validation (enforced by the route-auth matrix); Conduit /mcp 401 | [in progress] Resonance #243, #244, #245, #246 (resume long-id 400 found live 17:03 ET; #243, #244 and #246 bot-approved, awaiting a human merge; live smoke #248 tracks them as transitional) |
| 3 | PR entropy | Fewer than 10 open PRs per repo for 7 days | [in progress] 23 / 16 / 24 (QS / Conduit / Resonance, 06:05 ET 2026-10-26; QS +2 from Quicksilver Dev (#407, #408); new: QS #406 docs, Conduit #334 Bolt; Resonance +1 is the #249 guard; QS −3 via Quicksilver Dev merges #397 #400 #401); owner-only floor 22 / 9 / 21+; measured by #326, trend by #327 |
| 4 | Main protection + CI integrity (direct docs pushes to main seen 14:06Z and 18:02Z; none since, per direct-push-audit #329; re-checked 22:05 ET) | Rulesets with required checks; Actions SHA-pinned (Conduit done; Resonance #189; QS #250); Workers Builds noise removed | [blocked] owner rulesets |
| 5 | Dependency hygiene | 0 Dependabot alerts | [passed] 0/0/0 Dependabot at 18:01 ET; Conduit `npm run audit:deps` gate merged (#330) |
| 6 | Data-plane safety | RLS guard in CI (#241); migrations applied by the owner (#173 #207 #208); Conduit DB TLS verify (#155, #201) | [blocked] owner |
| 7 | Bounded surface | Body caps, outbound timeouts (#242), idempotent replays (#209), resume guard (#206) | [in progress] |
| 8 | Observability | Probe classifiers (cold start #314/#315, verdict #322, maturity #323) on main; score counts owned deployments only | [in progress] #323 + #325 |
| 9 | Branch hygiene | Stale branches listed with restore commands; deletes are owner-approved only | [in progress] 20 merged Conduit branches deleted ~13:03 ET (restore file kept); rest listed |
| 10 | 1.0 | 30 days green, runbooks, alias decision made, CHR-55 recorded by the owner | [blocked] CHR-55 `not_recorded` |

---

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

## 05:00 ET refresh (2026-10-25 09:00Z)

**Probes (05:01–05:02 ET):** Conduit `/ready` 200 on all 5 attempts (t+0/10/20/30/45s, 0.19–0.30s each, `production:true`, `persistence:postgres`, rev `2026-10-03-ready-surface`); `/health` 200. The owner-reported 503 cold start did not reproduce, so the service was warm and had recovered. Resonance `/api/ready` 200 `contract_passed`, `missingRequired:[]`, `persistenceConfigured:true`, rev `2026-10-03-owner-gate`. Both contract revisions are 22 days old, so the new verdict classifier (Conduit #322) reads this as `drift`, not `ready`.

**Open PRs before/after:** Conduit 21→21 (closed #320, opened #322), Resonance 19→19, QuicksilverV1 16→16.

**Closures:** Conduit #320 (Bolt keyset micro-opt). It is low value, touches cursor validation and overlaps #204. Branch kept.
**Docs PRs kept:** QS #384 (`QUICKSILVER-ROADMAP-1.0.md` is not on main or in any other PR) and QS #390 (its audit files are unique). Both are still not superseded. Resonance #240 is the living docs PR.

**New since the 04:00 pass:** Conduit #321 (draft: `index.ts` boots via `createConduitApp`), Resonance #243 (skills/resolve 401 before body parse), Conduit #322 (pure cross-plane readiness verdict).

**Stale-branch restore:** Conduit commands for all 45 branches are now in `/workspace/roadmaps/stale-branches-Conduit-restore.txt`, with the TSV in `stale-branches-Conduit.tsv`. Nothing was deleted.

### Living status (2026-10-25 19:15 ET)

| Project | Readiness | CI (main) | Open PRs | Score | Top gate | Next step |
|---|---|---|---|---|---|---|
| Conduit | /ready 200 x5 warm, health ok, /mcp 401; probe flags `shape_changed` vs conduit-ready schema | `CI` success | 20 (+#323, -#317, -#319) | ~7.0 | prod lockdown (#206/#212) owner review | re-review #322/#313/#314; reconcile /ready schema |
| Resonance | /api/ready 200 contract_passed; executions 401; skills/resolve 400 before 401 (#243 open) | `CI` success | 19 | ~6.8 | unapplied migrations (#207/#208/#214/#173) | owner applies migrations; review #243, #174 |
| QuicksilverV1 | n/a (iOS); CHR-55 not_recorded | `Quicksilver CI` (ci.yml) success on ba0ecd6. The 05:00 row cited Prune Merged Branches, which is not CI. | 17 | ~7.5 | CHR-55 device run (owner) | review #392/#395/#394; keep #384/#390 |

Portfolio ~7.0. Resonance docs are canonical; not mirrored to other repos.


### Innovation track (11:00 ET)
- Done (PRs open): Resonance #245 route-auth matrix; Conduit #325 owned-only score; Conduit #326 PR hygiene report.
- Next: wire #326 into the scheduled portfolio-probe as a report-only job; cross-plane contract-revision check (both /ready revisions vs committed expectations); an SSE idle watchdog for Resonance adapters.

### Innovation track (22:00 ET)

- **Shipped (open PRs):**
  - Conduit #332: one shared, fail-closed owner-only path list for the merge gates.
  - Conduit #328 round 6: an all-caps name declared as a code constant in the PR's own diff is no longer an env var; with no diff evidence it still blocks. The external-policy, bridge and receipt files are now gated.
- **Next (proposed, structural):**
  - A read-only cross-repo consistency check (Conduit script): compare each repo's `/ready` `contractRevision` and owner-gate stamps, plus the roadmap phase statuses in this file, against live evidence; fail-closed on mismatch.
  - Have #328 import #332's module once both land.

### 23:00 ET evidence (2026-10-25)

- **Probes (23:04 ET):**
  - Conduit `/ready` 200 (production on Postgres, v0.8.0).
  - Resonance `/api/ready` 200 (contract_passed, auth required).
  - Unauthenticated POST executions still returns **400**; the 401 fix (#244) is unmerged.
- **Main CI:** green (Conduit d44b971, Resonance e01421d). No direct pushes since 22:00 ET.
- **Open PRs:** Conduit 14, Resonance 23. Owner-only, measured with #332's list via #326: Conduit 9, Resonance 10.
- **Age buckets (0-1d / 2-7d / 8-14d / 15d+):** Conduit 6/0/6/2, Resonance 9/0/14/0.
- **Overlap pairs:** Conduit 21 (nearly all among the owner-gated auth/grants/TLS PRs), Resonance 13.
- **Hygiene:** no docs-only or roadmap-refresh PR is fully superseded by main. Resonance #240 is the only docs PR and carries content not on main, so it stays open.
- **Conduit #202:** every listed stale branch is already gone (verified via the API), so there is nothing to prune.
- **Pending decisions:**
  - Conduit #201 (DB TLS): set the Render `DATABASE_SSL` env, then merge #155 (#162 overlaps it). Live DB TLS still doesn't verify certs.
  - Resonance #167 (auth mode): main still defaults to `auto`. Prod is safe only because its env sets `required`. Decide on #174 (fail-closed default).
  - Resonance #166 (Gemini): `gemini.yml` still uses `gemini-1.5-pro` with continue-on-error, so the check gives no signal. Update the model or remove the workflow.
- **Innovation:** the cross-repo entropy fields (age buckets, overlap pairs, owner-only count) were added to the existing #326 report rather than a duplicate script.

### 2026-10-26 00:00 ET

- **Canonical evidence:** [AUDIT-2026-10-26.md](AUDIT-2026-10-26.md).
- **Dashboard (Conduit #333, stacked on #326):** live READY. Owned planes are ready; the Vercel aliases are not ours (informational, never a gate).
- **Open PRs:** QS 20 / Conduit 14 (+#333 = 15) / Resonance 23.
- **Phase 2:** still in progress. Live unauthenticated POST returns 400.
- **Phase 3:** QS improved by 3 merges.
- **Phase 5:** secret scan clean (fixtures only).
- **Phase 10:** blocked on CHR-55 (`not_recorded`).
- **Innovation track:** #333 dashboard; #326 entropy fields; #332 shared owner-only list; #328 code-constant env exemption.
- **Next:** retarget #333 to main after #326 merges, then add a cross-repo contract and roadmap consistency check.

---

## 2026-10-26 01:00 ET pass

No merges in any repo this pass (rule for the pass). QS read-only.

**Phase evidence, owner gate (machine-checked where marked ✓ by `portfolio-dashboard.mjs --consistency`, Conduit #333):**

| # | Exit criteria | Evidence at 01:10 ET | Owner gate |
|---|---|---|---|
| 1 ✓ | Both /ready 200, production true, revisions match pins | Conduit `2026-10-03-ready-surface`, Resonance `2026-10-03-owner-gate`, both match; Resonance ownerKeys [] | none |
| 2 ✓ | Unauthenticated routes 401 before validation | POST /api/nexus/executions unauthenticated → **400** (fail; #244 fixes) | human merge of #243 #244 #246 |
| 3 ✓ | <10 open PRs per repo, 7 days | 20 / 15 / 24 | human merges / closes |
| 4 | Rulesets + required checks | GitHub `protected`: Resonance true, Conduit false, QS false | owner rulesets |
| 5 | 0 Dependabot; `npm audit` 0 | npm audit 0/0 (Conduit, Resonance) at 01:05 ET; QS has no third-party SwiftPM packages | none |
| 6 | RLS guard, migrations, DB TLS | unchanged | owner (Render DATABASE_SSL, migrations) |
| 7 | Bounded surface | unchanged; #242 open | human merge |
| 8 | Probe classifiers on main | portfolio-probe report-only green 04:54Z run 40271466525 | none |
| 9 | Branch hygiene | unchanged | owner deletes |
| 10 ✓ | All above + CHR-55 | not met; CHR-55 `not_recorded` | owner |

Consistency run (roadmap ref = this branch): CONSISTENT, no stale claims. Against `main` it fails closed with `roadmap_unparseable` because main's copy predates the current table — that is the real drift until #240 merges.

**Drift against each repo's own roadmap:**
- Conduit `docs/ROADMAP-10-PHASE.md` (last edit 2026-10-25 02:10 ET): numbering differs (its 1 = PR entropy, 3 = fail-closed auth); it still names closed PRs #302 #305 #307 #308 #313 #314 #315 as the work items. Stale.
- Resonance `docs/ROADMAP.md` (last edit 2026-09-30): P1 marks `RESONANCE_AUTH_MODE` done, but issue #167 (default still `auto`) is open; prod is `required` only by config. Nothing about the fail-closed 401 gap (phase 2) or the provider-neutral guard (#249). P0 "branch protection" agrees with GitHub (`protected: true`).
- QuicksilverV1: the 1.0 roadmap exists only in unmerged #384; main has none. Its order (CHR-55 first) is consistent with phase 10 here.

---

## 2026-10-26 05:00 ET pass

- **No merges.** No Conduit PR meets the merge criteria: #323, #326, #328, #332 and #333 still carry a CodeRabbit CHANGES_REQUESTED on record (the fixes are pushed; the re-reviews haven't landed), and #325 is stacked on #323. Resonance needs a human. QS is read-only.
- **Main unchanged since 02:00 ET** in all three repos (Conduit d44b971, Resonance e01421d, QS a344a8d; all green).
- **Phase 2 still fails live:** an unauthenticated POST /api/nexus/executions returns 400. #243, #244 and #246 are approved and green and are waiting on a human merge.
- **Alias drift (phase 8):** the dashboard already treats the Vercel aliases as informational. On main, `portfolio-probe.mjs` still averages them into the score and gates its exit on them, so every run fails. #325 now fixes both (score over owned targets only; exit via `probeExitPass`, which fails closed when no owned target answers). The aliases are not ours, so this is not an owner action; the remaining decision is whether to claim or drop the names.
- **Automation:** #333 adds a report-only dashboard `--consistency` step to the scheduled portfolio-probe workflow (default token, no secrets). Against `main` it will report `roadmap_unparseable` until #240 merges. That is correct, fail-closed behaviour.

| # | Exit criteria | Evidence 05:10 ET | Owner gate |
|---|---|---|---|
| 1 | Both ready, revisions match | pass | none |
| 2 | Unauthenticated → 401 | **fail** (400) | merge #246 → #243 → #244 |
| 3 | <10 open PRs, 7 days | fail: 21 / 16 / 24 | merges and closes |
| 4 | Rulesets | Conduit and QS unprotected | owner |
| 5 | 0 vulnerabilities | pass (npm audit 0/0) | none |
| 6 | Data-plane safety | unchanged | owner (DB TLS, migrations) |
| 7 | Bounded surface | #242 open | human merge |
| 8 | Owned-only probe score and gate | #325 open | merge stack #323 → #325 |
| 9 | Branch hygiene | unchanged | owner |
| 10 | 1.0 | CHR-55 `not_recorded` | owner device run |

---

## 2026-10-26 06:00 ET pass: 10-phase proposal (current)

Scores (unchanged; no main branch moved since 02:00 ET): **Conduit 7.1, Resonance 6.1, QuicksilverV1 6.0**, mean 6.4.

| # | Phase | Exit criteria | Evidence 06:05 ET | Status | Owner gate |
|---|---|---|---|---|---|
| 1 | Contract consistency | Both /ready 200 and production; revisions match pins; parity tests | dashboard `--consistency` CONSISTENT | passed | none |
| 2 | Fail-closed edges | Every unauthenticated route returns 401 before validation; Conduit /mcp 401 | Resonance POST /api/nexus/executions → 400 | in progress | human merge #246 → #243 → #244, then #245 and #248 |
| 3 | PR entropy | <10 open per repo for 7 days | 23 / 16 / 24 | in progress | merges and closes |
| 4 | Main protection | Rulesets with required checks in all 3 repos | Resonance protected; Conduit and QS not | blocked | owner rulesets |
| 5 | Dependency hygiene | npm audit 0; Dependabot 0; majors tracked | audit 0/0; next 15→16 and typescript 5→7 behind | passed (majors open) | none |
| 6 | Data-plane safety | RLS guard in CI; migrations applied; Conduit DB TLS verify | #241 open; #173, #207 and #208 not applied; #155 waits on Render env | blocked | owner |
| 7 | Bounded surface and adapters | Timeouts on provider fetches; adapter contract (neutral surface, fail-closed unconfigured, no key in URL or errors); body caps | #242 now carries the timeouts, the Gemini key moved to a header, and the contract test | in progress | human merge #242 |
| 8 | Observability | Owned-only score and exit gate; scheduled dashboard | #325 (exit gate), #333 (scheduled step) | in progress | merge stacks #323 → #325, #326 → #333 |
| 9 | Capability and policy plane wired | Policy gate on every chamber and provider call; `requirePolicy` refuses `requiresApproval` decisions; deny-by-default test | gate exists but has **no caller**; chambers are interfaces only; `lib/ai` is imported nowhere outside itself | planned | two-key (policy gate) |
| 10 | 1.0 | 30 days green, runbooks, alias decision, CHR-55 recorded | CHR-55 `not_recorded` | blocked | owner device run |

Highest-value next steps: (1) human merge of Resonance #246 → #243 → #244 (closes phase 2); (2) re-request CodeRabbit on the Conduit stacks so they become mergeable under the criteria; (3) decide #167 (auth default) together with #174; (4) a two-key decision on the policy-gate fix below before any chamber is wired.


## 2026-10-26 08:00 ET pass: 10-phase status (current)

No main branch moved since 06:00 ET (0 merges in any repo). Scores unchanged: **Conduit 7.1, Resonance 6.1, QuicksilverV1 6.0**. Probes 08:03 ET: Conduit /ready 200; Resonance /api/ready 200 `contract_passed`, `authMode: required`.

| # | Phase | Exit criteria | Evidence 08:05 ET | Status | Owner gate |
|---|---|---|---|---|---|
| 1 | Contract consistency | Both /ready 200 + production; pins match | both 200, revision `2026-10-03-owner-gate` | passed | none |
| 2 | Fail-closed edges | 401 before validation on every route | #243/#244/#246/#245/#248 still open, all MERGEABLE | in progress | human merge |
| 3 | PR entropy | <10 open per repo for 7 days | Resonance 26 (incl. new #250/#251), Conduit 16, QS 17 | in progress | merges/closes |
| 4 | Main protection | Rulesets + required checks in all 3 repos | unchanged | blocked | owner rulesets |
| 5 | Dependency hygiene | audit 0; majors tracked | unchanged | passed (majors open) | none |
| 6 | Data-plane safety | RLS guard in CI; migrations applied; DB TLS | #241, #173, #207, #208, #155 unchanged | blocked | owner |
| 7 | Bounded surface | Provider timeouts; adapter contract | #242 all checks green incl. ios + CodeRabbit | ready for review | human merge #242 |
| 8 | Observability | Owned-only score + scheduled dashboard | Conduit #323–#334 CodeRabbit still CHANGES_REQUESTED; Workers Builds check failing (external, non-gating) | in progress | address CodeRabbit, then merge |
| 9 | Policy plane | `requirePolicy` refuses unapproved `requiresApproval`; deny-by-default test | **draft #250** (6 tests); log redaction #251 | draft | **two-key** (#250) |
| 10 | 1.0 | 30 days green, runbooks, CHR-55 recorded | CHR-55 `not_recorded` | blocked | owner device run |

## 2026-10-26 09:00 ET pass: portfolio 10-phase proposal (current)

Identities stay separate: QuicksilverV1 (iOS, on-device-first, CHR-55 owner gate), Resonance (Netlify production `resonancenexus.netlify.app` + Supabase; the Vercel preview check on PRs is non-gating), Conduit (Render free tier, Postgres optional). No merges since 08:00 ET. Probes 09:0x ET: Conduit /ready 200 (`persistence: postgres`); Conduit POST /mcp unauthenticated → 401 with `WWW-Authenticate: Bearer … resource_metadata=https://…` (fails closed); Resonance /api/ready 200 `contract_passed`, served by Netlify.

| # | Phase (scope) | Exit criteria | Evidence 09:15 ET | Status | Owner gate |
|---|---|---|---|---|---|
| 1 | Contract consistency (Res+Con) | /ready 200 + production on both; pins match | both 200 | passed | none |
| 2 | Fail-closed edges (all) | 401 before validation; /mcp 401 with Bearer challenge; test-only switches refused in prod | Res #243/#244/#246/#245/#248 open; Conduit #335 (refuse CONDUIT_TEST_MEMORY in prod), #336 (auth-gate requires challenge) | in progress | human merge |
| 3 | PR entropy (all) | <10 open per repo for 7 days | Res 26, Con 18, QS 17 | in progress | merges/closes |
| 4 | Main protection (Con, QS) | rulesets + required checks | Resonance only | blocked | owner rulesets |
| 5 | Dependencies (all) | audit 0; majors planned | npm audit 0/0 both; majors: TS 5→7 (both), next 15→16, lucide 0→1, @types/node; QS has 0 SPM deps | passed (majors open) | none |
| 6 | Data-plane safety (Res, Con) | RLS guard in CI; migrations applied; DB TLS verify | #241, #173, #207, #208 unapplied; Conduit DB `rejectUnauthorized:false` (#155) | blocked | owner |
| 7 | Bounded surface (Res) | provider timeouts; adapter contract | #242 green | ready | human merge |
| 8 | Observability (Con) | owned-only score; scheduled dashboard; auth-gate with challenge | #323–#334 CodeRabbit CHANGES_REQUESTED; #336 | in progress | address CodeRabbit |
| 9 | Policy plane (Res) | requirePolicy refuses unapproved approval-required decisions | draft #250 (6 tests, green); #251 log redaction green | draft | **two-key** |
| 10 | 1.0 (QS) | 30 days green, runbooks, CHR-55 recorded | CHR-55 `not_recorded`; 12 `@unchecked Sendable` prod sites (issue #252) | blocked | owner device run |

## 2026-10-26 10:00 ET pass (current)

Probes 10:04 ET (all HTTP codes observed live):
- Conduit `/ready` 200 on first try: `status=ready, version=0.8.0, contractRevision=2026-10-03-ready-surface, persistence=postgres, production=true`.
- Conduit `POST /mcp` with no credentials: 401, `WWW-Authenticate: Bearer error="invalid_token", error_description="Missing Authorization header", resource_metadata="https://conduit-feco.onrender.com/.well-known/oauth-protected-resource/mcp"`.
- Resonance `/api/ready` 200 (Netlify): `status=ready, production=true, authMode=required, authModeOk=true, persistenceConfigured=true, githubAdapterConfigured=false, missingRequired=[], posture=contract_passed, contractRevision=2026-10-03-owner-gate`, timestamp 2026-10-26T14:04:18.882Z.
- Open PRs at 10:04 ET: QuicksilverV1 18 (new #411 by Quicksilver Dev), Conduit 18 (then 20 with #337/#338), Resonance 26. No merges since 09:00 ET.

| # | Phase | Exit criteria | Evidence 10:15 ET | Status | Owner gate |
|---|---|---|---|---|---|
| 1 | Contract consistency | both /ready 200 and pinned | Conduit #337 ready-pins: both OK pinned | passed | none |
| 2 | Fail-closed edges | 401 before validation; /mcp 401 + Bearer challenge; test switches only in test | Res #246 (behind 0, CodeRabbit approved), #243/#244 approved but behind main; Conduit #335/#336 review fixes pushed | in progress | human merge |
| 3 | PR entropy | <10 open per repo for 7 days | 18 / 20 / 26 | in progress | merges |
| 4 | Main protection | rulesets in Conduit and QS | none | blocked | owner |
| 5 | Dependencies | audit 0; majors planned | 0/0; TS 7, next 16 pending | passed (majors open) | none |
| 6 | Data-plane safety | RLS applied; DB TLS verify | #241 (CodeRabbit CHANGES_REQUESTED), #173/#207/#208, #155 | blocked | owner |
| 7 | Bounded surface | provider timeouts | #242 behind 6, 4 unresolved threads | in progress | rebase, then human merge |
| 8 | Observability | owned-only score; posture pins | #323 → #325 stack; #337 | in progress | address CodeRabbit |
| 9 | Policy plane | requirePolicy deny-by-default | draft #250 green | draft | **two-key** |
| 10 | 1.0 | 30 days green; CHR-55 recorded | not recorded | blocked | owner device run |

Mirrors: Conduit #338 (pointer + Conduit-only phases). QuicksilverV1: no mirror opened. #406 already edits the same two files, and the shared account means authorship can't be told apart from Quicksilver Dev's, so it stays a proposal.

## 2026-10-26 11:00 ET pass: net PR reduction (current)

Probes 11:02:33 ET: Conduit `/ready` **200 on the first attempt** (the owner's 503 cold start had already cleared). Body: `ready, 0.8.0, contractRevision 2026-10-03-ready-surface, postgres, production true`. Conduit `POST /mcp` with no credentials: 401 with a Bearer challenge carrying `resource_metadata`. Resonance `/api/ready` 200 `contract_passed`, `missingRequired=[]`, `persistenceConfigured=true`.

Open PRs before → after this pass: QuicksilverV1 18 → 18 (proposals only), Conduit 20 → 16, Resonance 26 → 23. Nothing closed was lost: each was folded into a surviving PR.

| # | Phase | Exit criteria | Status | Owner gate |
|---|---|---|---|---|
| 1 | Contract consistency | both /ready 200 and posture-pinned | passed | none |
| 2 | Fail-closed edges | 401 before validation everywhere; /mcp challenge; test switches refused outside test | in progress (Res #243/#244/#245 updated to main, #246; Con #335) | human merge |
| 3 | PR entropy | <10 open per repo for 7 days | in progress (16 / 23 / 18) | merges |
| 4 | Main protection | rulesets in Conduit + QS | blocked | owner |
| 5 | Dependencies | audit 0; majors planned | passed (majors open) | none |
| 6 | Data-plane safety | RLS migrations applied; DB TLS verify | blocked | owner |
| 7 | Bounded surface | provider timeouts + neutrality guard | in progress (#242 now includes the #249 guard) | human merge |
| 8 | Observability | owned-only score, dashboard, merge gates on one path list | in progress (Con #325, #333, #328) | address CodeRabbit |
| 9 | Policy plane | requirePolicy deny-by-default | draft #250 | **two-key** |
| 10 | 1.0 | 30 days green, runbooks, CHR-55 recorded | blocked | owner device run |

### Innovation track

| Item | Where | Status | Owner gate |
|---|---|---|---|
| Posture pins + Bearer-challenge auth gate | Conduit #336 (folded #337) | open, green | review |
| One owner-only path list for merge-train + merge-readiness | Conduit #328 (folded #332) | open | review |
| Cross-plane dashboard + PR hygiene report | Conduit #333 (folded #326) | open | address CodeRabbit |
| Policy deny-by-default | Resonance #250 | draft | two-key |
| Content-free device run stamp (QS) | QuicksilverV1 #392 (Quicksilver Dev) | open | owner, CHR-55 |

## 2026-10-26 12:00 ET (current)

Phases 1–10 remain binding. Highest leverage: **PR entropy prune (merge the green Resonance train), then CHR-55**. Counts 19 / 16 / 23.

| # | Phase | Status | Owner gate |
|---|---|---|---|
| 1 | Contract consistency | passed (both 200, pinned) | none |
| 2 | Fail-closed edges | ready to merge: Res #247→#246→#243→#244→#245→#248 (readiness comments posted) | human squash merge |
| 3 | PR entropy | 19 / 16 / 23 | merges |
| 4 | Main protection | blocked | owner rulesets |
| 5 | Dependencies | passed (majors open) | none |
| 6 | Data-plane safety | blocked | owner |
| 7 | Bounded surface | #242 (4 threads) | human merge |
| 8 | Observability | Conduit #325/#328/#333 CodeRabbit CHANGES_REQUESTED; #333 CI re-run on new base | address reviews |
| 9 | Policy plane | draft #250 | two-key |
| 10 | 1.0 / CHR-55 | In Review; not_recorded; QS #392/#412 in flight | owner device run |
