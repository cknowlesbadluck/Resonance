# Resonance — 10-phase roadmap to a finished Nexus with an iOS peer (updated in place 2026-10-17 07:25 EDT)

Product-only roadmap; Resonance stays domain-independent. Current audit: `docs/AUDIT-2026-10-13.md`. Engineering phase map: `docs/ROADMAP.md`.
Status vocabulary: **done** · **in review** (PRs open, CI green) · **blocked on owner** (owner action, key, migration or Netlify) · **not started**.

| # | Phase | Exit criteria | Status (2026-10-17 07:25 EDT) |
|---|---|---|---|
| 1 | Green, reviewed main | main CI green; actions SHA-pinned; the stack on #161 merged with one review | **blocked on owner**: review throughput. main CI green (7ac2ffc); PR CI (web, ios, CI) green on every open PR; `gemini` is cancelled by its concurrency group (not code). 44 open PRs at 07:25 EDT (45 before #158 was closed as stale/superseded); 4 merged/closed-PR branches pruned |
| 2 | Lean code | dead `lib/ai` (#183) and chambers/policy (#193) pruned; one service-role client helper (#212, CodeRabbit approved); ESLint baseline (#211) | **in review** (#183, #193, #203, #211, #212). #211 conflicts with #183/#190/#193/#194/#202 (package files and pruned files), so merge it after the prunes and deps |
| 3 | Fail-closed auth | `RESONANCE_AUTH_MODE` fails closed (#174); host-signal prod detection (#185); route auth matrix tested | **in review** |
| 4 | Bounded + private surface | rate limits (#175); bounded idempotency (#186); sanitized errors + requestId (#172/#177/#181); evidence redaction (#191); `/api/ready` names-only test (#198); resume body bounded (#206); fair share per instance (#213); **fair share across instances via shared leases (#214, opt-in, fail-safe to local)** | **in review**: #213 green incl. ios; #214 stacked on #213 |
| 5 | Data security | RLS lint + read-only verify (#195/#196) run by owner; `search_path` fix (#173), anon/unscoped RLS close (#207), list indexes (#208) and the lease table (#214) applied by owner | **blocked on owner** (owner applies migrations; #214 labelled `owner applies`) |
| 6 | Honest production | `/api/ready` 200 on Netlify with commitSha (#178); needs `SUPABASE_SERVICE_ROLE_KEY` (owner) | **blocked on owner**: the 06:01 EDT probe returned **503** with `missingRequired: [SUPABASE_SERVICE_ROLE_KEY]`. Edge `age` is about 19.9 days, so prod is still the 2026-09-27 deploy. Owner: restore Netlify publishing and set the key |
| 7 | Single capability model | client-only module retired (#156 ✓); one server schema generates TS + Swift `NexusCapability`; contract test (#184) | **in review** (#184, #182); schema generation **not started** |
| 8 | Exactly-once execution | `Idempotency-Key` required (already enforced); durable claim/replay in Supabase mode; events replay duplicates (#209); resume CAS-idempotent (#206); signed webhook delivery id (#210) | **in review** (code); durable execution journal RFC in `docs/ARCHITECTURE.md` (interface + in-memory implementation prepared, PR not yet opened); production proof **blocked on owner** (key) |
| 9 | iOS peer parity | Xcode app target builds `ios/App`; iOS composes, executes **and approves/resumes** through `ResonanceCore`; Swift contract tests share web fixtures; device acceptance with real evidence | **not started** beyond the library (no app target, no resume in NexusClient) |
| 10 | Finished Nexus | web + iOS end-to-end against production; failover (#188); runbook (#197); 7 consecutive days of `/api/ready` 200 | **blocked on owner** (phase 6), **not started** for the iOS half |

## Merge train (2026-10-17 07:25 EDT)

Agents don't merge Resonance PRs; the owner does. Simulated locally on main 7ac2ffc: main + #172 → #176 → #177 → #178 → #180 → #181 → #212 → #209 → #213 → #214 with the resolutions below passes `tsc --noEmit` and vitest (275 passed, 1 skipped).

| Step | PR | Depends on | Expected conflict and exact resolution |
|---|---|---|---|
| 1 | #204 CI on any base | main | none (stacked PRs then get CI) |
| 2 | #198 gemini concurrency + `/api/ready` privacy test | main | none |
| 3 | #172 → #176 → #177 → #178 → {#179, #180}, #181 (audit stack) | each on its parent branch | none in order. #179/#180/#181 are 12–13 commits behind their parents; the update merges are prepared locally but **not pushed** (push approval expired; owner can re-request) |
| 4 | #212 `createServiceRoleClient` | stack (#172, #177) | import blocks only in `app/api/events/route.ts`, `app/api/nexus/executions/route.ts`, `app/api/nexus/executions/[id]/resume/route.ts`: keep the stack's `db-error` imports (`bodyErrorMessage`, `persistenceErrorResponse`, `publicFailure` as each file needs), take `createServiceRoleClient`, drop `createClient` from `@supabase/supabase-js`. Snippets on #212 |
| 5 | #209 idempotent event replay | #172, #212 | `app/api/events/route.ts`: keep all imports (`db-error`, `service-client`, `isUniqueViolation`, `resolveEventExternalId`); keep #209's unique-violation replay block (200 + `X-Idempotent-Replay`, else 409); **final fallback is #172's `persistenceErrorResponse("events.insert", error, request)`**, never the raw `error.message` 500. Snippet on #209 |
| 6 | #213 fair share | main | none |
| 7 | #214 shared leases | #213 | none (migration applied by owner only) |
| then | #210, #203 (rebase on `src/nexus/runtime.ts`), #190 → #194 (deps; #194 lockfile refresh after #190), prunes #183/#193 → #211 (lint last of the package-file group) | | package/pruned-file pairs listed below |

**#202 vs #178 (decided):** keep **#202's field-set contract check** as the deploy-parity script. It works against the stale 2026-09-27 prod today, where commitSha parity can't (prod doesn't serve `commitSha` until #178 is deployed). Before #178 lands, drop `scripts/deploy-parity.mjs`/`.d.mts` from #178 and keep #178's additive `commitSha` on `/api/ready`; a SHA comparison can be added to #202's script as a second verdict later. #179's schedule should call #202's script. Not closed: both carry unique work.

**Not duplicates (kept open):** #157 vs #193 touch different files and don't conflict (#157 adds an unwired dissolve guard; owner decides). #190 vs #194 bump disjoint packages except `@types/node`.

**Open PR conflicts (pairwise, 07:25 EDT):**
- `app/api/events/route.ts` and execution routes: #209, #212 vs the #172 stack (resolutions above).
- `scripts/deploy-parity.mjs`: #202 conflicts with #178, #179 and #180.
- `src/nexus/runtime.ts`: #203 conflicts with #210, #213 and #214.
- Package files: #190×#194, #190×#211, #194×#211, #202×#211.
- Pruned files: #211 conflicts with #183 and #193.

Composition, coordination and integration hygiene principles: `docs/ARCHITECTURE.md` (sections *Composition and coordination without domination* and *Integration hygiene rules*).
