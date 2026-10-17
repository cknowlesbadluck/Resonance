# Resonance — 10-phase roadmap to a finished Nexus with an iOS peer (updated in place 2026-10-17 14:10 EDT)

Product-only roadmap; Resonance stays domain-independent. Current audit: `docs/AUDIT-2026-10-13.md`. Engineering phase map: `docs/ROADMAP.md`.
Status vocabulary: **done** · **in review** (PRs open, CI green) · **blocked on owner** (owner action, key, migration or Netlify) · **not started**.

| # | Phase | Exit criteria | Status (2026-10-17 07:25 EDT) |
|---|---|---|---|
| 1 | Green, reviewed main | main CI green; actions SHA-pinned; the stack on #161 merged with one review | **blocked on owner**: review throughput. main CI green (7ac2ffc); PR CI (web, ios, CI) green on every open PR; `gemini` is cancelled by its concurrency group (not code). 44 open PRs at 07:25 EDT (45 before #158 was closed as stale/superseded); 4 merged/closed-PR branches pruned |
| 2 | Lean code | dead `lib/ai` (#183) and chambers/policy (#193) pruned; one service-role client helper (#212, CodeRabbit approved); ESLint baseline (#211) | **in review** (#183, #193, #203, #211, #212). #211 conflicts with #183/#190/#193/#194/#202 (package files and pruned files), so merge it after the prunes and deps |
| 3 | Fail-closed auth | `RESONANCE_AUTH_MODE` fails closed (#174); host-signal prod detection (#185); route auth matrix tested | **in review** |
| 4 | Bounded + private surface | rate limits (#175); bounded idempotency (#186); sanitized errors + requestId (#172/#177/#181); evidence redaction (#191); `/api/ready` names-only test (#198); resume body bounded (#206); fair share per instance (#213); **fair share across instances via shared leases (#214, opt-in, fail-safe to local; 11:00 EDT tests: clock-skew safe because expiry uses DB `now()`, busy adapter lease frees the project lease and local slots, hung acquire leaks nothing)** | **in review**: #213 green incl. ios; #214 stacked on #213 |
| 5 | Data security | RLS lint + read-only verify (#195/#196) run by owner; `search_path` fix (#173), anon/unscoped RLS close (#207), list indexes (#208) and the lease table (#214) applied by owner | **blocked on owner** (owner applies migrations; #214 labelled `owner applies`) |
| 6 | Honest production | `/api/ready` 200 on Netlify with commitSha (#178); needs `SUPABASE_SERVICE_ROLE_KEY` (owner) | **blocked on owner**: the 06:01 EDT probe returned **503** with `missingRequired: [SUPABASE_SERVICE_ROLE_KEY]`. Edge `age` is about 19.9 days, so prod is still the 2026-09-27 deploy. Owner: restore Netlify publishing and set the key |
| 7 | Single capability model | client-only module retired (#156 ✓); one server schema generates TS + Swift `NexusCapability`; contract test (#184) | **in review** (#184, #182); schema generation **not started** |
| 8 | Exactly-once execution | `Idempotency-Key` required (already enforced); durable claim/replay in Supabase mode; events replay duplicates (#209); resume CAS-idempotent (#206); signed webhook delivery id (#210) | **in review** (code); durable execution journal RFC in `docs/ARCHITECTURE.md` (interface + in-memory implementation in #215); production proof **blocked on owner** (key) |
| 9 | iOS peer parity | Xcode app target builds `ios/App`; iOS composes, executes **and approves/resumes** through `ResonanceCore`; Swift contract tests share web fixtures; device acceptance with real evidence | **not started** beyond the library (no app target, no resume in NexusClient) |
| 10 | Finished Nexus | web + iOS end-to-end against production; failover (#188); runbook (#197); 7 consecutive days of `/api/ready` 200 | **blocked on owner** (phase 6), **not started** for the iOS half |

## Status board (2026-10-17 15:15 EDT; main 7ac2ffc, nothing merged; prod `/api/ready` still 503 `missingRequired: [SUPABASE_SERVICE_ROLE_KEY]`, owner-blocked)

Tags: **[passed]** = exit check met on main · **[in progress]** = PRs open, CI green · **[blocked]** = needs owner action. Nothing has merged to Resonance main since #192 (7ac2ffc). Every PR listed below is **open**.

| Phase | Tag | Exit check (how it's verified) |
|---|---|---|
| 1 Green, reviewed main | [blocked] | main CI green (7ac2ffc) ✓; branch protection: `CI` required, strict, 1 review. PR `gemini` "failures" are concurrency cancellations (issue_comment runs share the PR's group); **#198** fixes it, so merge it first. Owner review throughput for 47 open PRs |
| 2 Lean code | [in progress] | `npx knip` on main: the only unused files are `lib/ai/*` (#183) and `src/chambers/*` + `src/policy/gate.ts` (#193); unused exports in #203. No TODO/FIXME/XXX in code |
| 3 Fail-closed auth | [in progress] | #174, #185 open; route auth matrix tested on those branches |
| 4 Bounded + private surface | [in progress] | #216 (outbound fetch timeouts + guard), #172 stack, #175, #186, #191, #206, #213/#214, **#218** open. #218 bounds executor retries (attempts ≤5, delay ≤30s) |
| 5 Data security | [blocked] | owner applies the #173, #207, #208, #214 migrations, then `scripts/verify-rls.sql` (#196) is clean |
| 6 Honest production | [blocked] | 13:01 EDT (re-checked): `/api/ready` **503**, `missingRequired: [SUPABASE_SERVICE_ROLE_KEY]`, prod behind main (no `contractRevision`/`posture`). Owner says the Supabase project is **paused**. **#202** now has `node scripts/deploy-parity.mjs --plan`, which turns the live body into ordered owner steps: restore project → set `SUPABASE_SERVICE_ROLE_KEY` in Netlify Production env → redeploy main → verify (`--strict` + smoke) |
| 7 Single capability model | [in progress] | #184 contract, #182 adapter contract, #217 policy dry-run open; schema generation not started |
| 8 Exactly-once execution | [in progress] | #215 journal contract, #209 replay, #206 resume guard, #210 webhook, **#218 retry classification** open (`src/nexus/retry-policy.ts`: permanent codes never retry; ambiguous `timeout`/`unavailable` never blindly re-run a step whose grants are ≥ `modify`, derived from the single capability model in `grants.ts`; `execution.retry_skipped` event); Supabase journal store + migration not started (owner applies) |
| 9 iOS peer parity | not started | app target builds; approve/resume via the journal |
| 10 Finished Nexus | [blocked] | depends on phase 6; 7 days of `/api/ready` 200 |

**15:15 EDT:** 48 open, unchanged (no merges, no closures). The only failing PR check is still `gemini` (20 PRs, all `cancelled`; #198). `merge-train` (#260 @ 914fe52) + sequential `git merge-tree` simulation: the 22 candidates (#173, #182, #184, #186, #188, #198, #208, #215, #169, #170, #175, #193, #183, #187, #185, #190, #189, #191, #202, #172, #214) land clean in order except **#194 after #190** (`package.json`/lockfile, as expected: regenerate the second). New collision found and fixed: **#218 × #213/#214** (adjacent import lines in `src/nexus/executor.ts`) → #218 moved its `retry-policy` import below `./types` (6c25ab3); #218 + #214 merged locally passes `tsc` and 164 nexus tests.

**14:10 EDT:** 48 open (47 + #218; no merges, no closures, nothing clearly superseded). `npm audit` 0 vulnerabilities; all workflow actions SHA-pinned; #194 already carries next 15.5.28, vitest 4.1.12, @types/node 22.20.5 (patch only). The only failing PR check is `gemini` (`cancelled`, concurrency; #198). No branch without an open PR is free of unique commits, so none deleted. Linear (read-only): CHR-54 `/api/ready` 200 still Todo/Urgent; CHR-33, CHR-24, CHR-25, CHR-39, CHR-45, CHR-46 in progress.

Open PRs at 13:10 EDT: 47, unchanged from 12:15 (no merges, no closures). Owner instruction from 13:00 EDT: agents merge nothing. Re-verified at 13:05 EDT:
- Every open PR is MERGEABLE against main.
- The audit stack #172 → #176 → #177 → #178 → {#179, #180}, #181 is current with each parent and with main (0 behind).
- The only red check anywhere is `gemini`. Every failing run inspected (#179, #212 and others) concluded `cancelled` (concurrency), not failed. **#198** fixes it.

`merge-train` (Conduit #260 @ 914fe52, now stacked-aware and treating a cancelled latest run as `rerun`, not red):
- Duplicate new file `src/nexus/fair-share.ts` in #213/#214. This is an intentional stack that targets `main` so CI runs (#214 ⊃ #213).
- #190/#194 have identical file sets but bump disjoint packages. Their lockfiles will conflict, so regenerate the second one after the first merges.
- #181/#172 share the same 4 files because #181 is stacked on that chain.
- Hotspot: `app/api/nexus/executions/route.ts` (6 PRs).

Recommended owner order: #198 → #204 → audit stack #172 → #176 → #177 → #181 → #178 → #179/#180 → #212 → #209 → #213 → #214 → #215/#216/#217 → #202 → rest per the train below.

## Merge train (2026-10-17 07:25 EDT)

Agents don't merge Resonance PRs; the owner does. Simulated locally on main 7ac2ffc: main + #172 → #176 → #177 → #178 → #180 → #181 → #212 → #209 → #213 → #214 with the resolutions below passes `tsc --noEmit` and vitest (275 passed, 1 skipped).

| Step | PR | Depends on | Expected conflict and exact resolution |
|---|---|---|---|
| 1 | #204 CI on any base | main | none (stacked PRs then get CI) |
| 2 | #198 gemini concurrency + `/api/ready` privacy test | main | none |
| 3 | #172 → #176 → #177 → #178 → {#179, #180}, #181 (audit stack) | each on its parent branch | none in order. #179/#180/#181 are 12–13 commits behind their parents; brought current with their parents at 08:01 EDT (owner-authorized push) |
| 4 | #212 `createServiceRoleClient` | stack (#172, #177) | import blocks only in `app/api/events/route.ts`, `app/api/nexus/executions/route.ts`, `app/api/nexus/executions/[id]/resume/route.ts`: keep the stack's `db-error` imports (`bodyErrorMessage`, `persistenceErrorResponse`, `publicFailure` as each file needs), take `createServiceRoleClient`, drop `createClient` from `@supabase/supabase-js`. Snippets on #212 |
| 5 | #209 idempotent event replay | #172, #212 | `app/api/events/route.ts`: keep all imports (`db-error`, `service-client`, `isUniqueViolation`, `resolveEventExternalId`); keep #209's unique-violation replay block (200 + `X-Idempotent-Replay`, else 409); **final fallback is #172's `persistenceErrorResponse("events.insert", error, request)`**, never the raw `error.message` 500. Snippet on #209 |
| 6 | #213 fair share | main | none |
| 7 | #214 shared leases | #213 | none (migration applied by owner only) |
| 8 | #215 execution journal, #216 fetch timeouts, #217 policy explain | main | none (new files; #216 edits only `scripts/production-smoke.mjs`) |
| 8b | #218 executor retry classification | main | touches `src/nexus/executor.ts`, `composer.ts`, `types.ts` (additive `ExecutionStep.sideEffect?`); no open PR edits `runStep` |
| then | #210, #203 (rebase on `src/nexus/runtime.ts`), #190 → #194 (deps; #194 lockfile refresh after #190), prunes #183/#193 → #211 (lint last of the package-file group) | | package/pruned-file pairs listed below |

**#202 vs #178 (decided):** keep **#202's field-set contract check** as the deploy-parity script. It works against the stale 2026-09-27 prod today, where commitSha parity can't (prod doesn't serve `commitSha` until #178 is deployed). Before #178 lands, drop `scripts/deploy-parity.mjs`/`.d.mts` from #178 and keep #178's additive `commitSha` on `/api/ready`; a SHA comparison can be added to #202's script as a second verdict later. #179's schedule should call #202's script. Not closed: both carry unique work. **Done 11:00 EDT:** #178 dropped its script (9ec340d, `commitSha` tests moved to `src/deploy/commit-sha.test.ts`); #179's schedule calls #202's script (fa0d767); #180 merged its parent. Simulated main + #202 + each of #178/#179/#180: no conflicts.

**Not duplicates (kept open):** #157 vs #193 touch different files and don't conflict (#157 adds an unwired dissolve guard; owner decides). #190 vs #194 bump disjoint packages except `@types/node`.

**Open PR conflicts (pairwise, 07:25 EDT):**
- `app/api/events/route.ts` and execution routes: #209, #212 vs the #172 stack (resolutions above).
- ~~`scripts/deploy-parity.mjs`: #202 conflicts with #178, #179 and #180.~~ Resolved 11:00 EDT.
- `src/nexus/runtime.ts`: #203 conflicts with #210, #213 and #214.
- Package files: #190×#194, #190×#211, #194×#211, #202×#211.
- Pruned files: #211 conflicts with #183 and #193.

Composition, coordination and integration hygiene principles: `docs/ARCHITECTURE.md` (sections *Composition and coordination without domination* and *Integration hygiene rules*).
