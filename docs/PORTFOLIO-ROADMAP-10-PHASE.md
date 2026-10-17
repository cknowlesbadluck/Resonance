# Resonance — 10-phase roadmap to a finished Nexus with an iOS peer (updated in place 2026-10-17 04:12 EDT)

Product-only roadmap; Resonance stays domain-independent. Current audit: `docs/AUDIT-2026-10-13.md`. Engineering phase map: `docs/ROADMAP.md`.
Status vocabulary: **done** · **in review** (PRs open, CI green) · **blocked on owner** (owner action, key, migration or Netlify) · **not started**.

| # | Phase | Exit criteria | Status (2026-10-17 04:12 EDT) |
|---|---|---|---|
| 1 | Green, reviewed main | main CI green; actions SHA-pinned; the stack on #161 merged with one review | **blocked on owner**: review throughput. PR CI (web, ios, CI) green on #210–#214; the `gemini` check fails on every PR (bot quota/config, not code) |
| 2 | Lean code | dead `lib/ai` (#183) and chambers/policy (#193) pruned; one service-role client helper (#212, CodeRabbit approved); ESLint baseline (#211) | **in review** (#183, #193, #203, #211, #212). #211 conflicts with #183/#190/#193/#194/#202 (package files and pruned files), so merge it after the prunes and deps |
| 3 | Fail-closed auth | `RESONANCE_AUTH_MODE` fails closed (#174); host-signal prod detection (#185); route auth matrix tested | **in review** |
| 4 | Bounded + private surface | rate limits (#175); bounded idempotency (#186); sanitized errors + requestId (#172/#177/#181); evidence redaction (#191); `/api/ready` names-only test (#198); resume body bounded (#206); fair share per instance (#213); **fair share across instances via shared leases (#214, opt-in, fail-safe to local)** | **in review**: #213 green incl. ios; #214 stacked on #213 |
| 5 | Data security | RLS lint + read-only verify (#195/#196) run by owner; `search_path` fix (#173), anon/unscoped RLS close (#207), list indexes (#208) and the lease table (#214) applied by owner | **blocked on owner** (owner applies migrations; #214 labelled `owner applies`) |
| 6 | Honest production | `/api/ready` 200 on Netlify with commitSha (#178); needs `SUPABASE_SERVICE_ROLE_KEY` (owner) | **blocked on owner**: the 04:02 EDT probe returned **503** with `missingRequired: [SUPABASE_SERVICE_ROLE_KEY]`. Edge `age` is about 19.9 days, so prod is still the 2026-09-27 deploy. Owner: restore Netlify publishing and set the key |
| 7 | Single capability model | client-only module retired (#156 ✓); one server schema generates TS + Swift `NexusCapability`; contract test (#184) | **in review** (#184, #182); schema generation **not started** |
| 8 | Exactly-once execution | `Idempotency-Key` required (already enforced); durable claim/replay in Supabase mode; events replay duplicates (#209); resume CAS-idempotent (#206); signed webhook delivery id (#210) | **in review** (code); production proof **blocked on owner** (key) |
| 9 | iOS peer parity | Xcode app target builds `ios/App`; iOS composes, executes **and approves/resumes** through `ResonanceCore`; Swift contract tests share web fixtures; device acceptance with real evidence | **not started** beyond the library (no app target, no resume in NexusClient) |
| 10 | Finished Nexus | web + iOS end-to-end against production; failover (#188); runbook (#197); 7 consecutive days of `/api/ready` 200 | **blocked on owner** (phase 6), **not started** for the iOS half |

**Open PR conflicts (pairwise, 04:05 EDT):**
- `app/api/events/route.ts`: #209 and #212 each conflict with every PR in the #172/#176–#181 audit stack. #212 also overlaps the stack on the execution routes.
- `scripts/deploy-parity.mjs`: #202 conflicts with #178, #179 and #180.
- `src/nexus/runtime.ts`: #203 conflicts with #210, #213 and #214.
- Package files: #190×#194, #190×#211, #194×#211, #202×#211.
- Pruned files: #211 conflicts with #183 and #193.
- Workflow files: #158 conflicts with #189, #198 and #204.

Suggested order: #204 (CI on any base, so stacked PRs get CI), then the audit stack, then #212 (rebase), then #209, then #213, then #214, then #210 and #203 (rebase).

Composition, coordination and integration hygiene principles: `docs/ARCHITECTURE.md` (sections *Composition and coordination without domination* and *Integration hygiene rules*).
