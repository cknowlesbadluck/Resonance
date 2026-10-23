# Portfolio 10-phase roadmap — refreshed 2026-10-23 10:30 UTC (merge pass + innovate)

Status tags: **[passed]** · **[in progress]** · **[blocked]** (owner action). Agents never apply migrations, change prod config, store secrets, or spend money.

Live evidence 2026-10-23T08:02Z (public HTTP / gh):
- Conduit `https://conduit-feco.onrender.com/ready`: **200**. main `cf3c86c`, CI success https://github.com/cknowlesbadluck/Conduit/actions/runs/39547238369.
- Resonance `https://resonancenexus.netlify.app/api/ready`: **503** `not_ready`, `missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"]`, authMode required. main `9422def`, CI success https://github.com/cknowlesbadluck/Resonance/actions/runs/39547210514.
- Vercel aliases (`npm run alias-drift`, #236): resonance.vercel.app 200 `stranger_occupant`; resonancenexus/resonanceplane.vercel.app 404 `alias_absent`. Drift = owner Vercel dashboard action.
- Open PRs after this pass: Conduit 34 (closed #255 dup of merged #263, #281 superseded by #282), Resonance 47 + #236 new (closed #234 superseded by #235). Earlier "~30/~28" figures were undercounts.
- Merged since 2026-10-17: Conduit #248–#254, #262, #263, #268, #269, #274; Resonance #218, #231.
- QuicksilverV1 not probed in this pass (out of scope).

Hygiene pass 2026-10-23T09:15Z (diff-verified against main and each other):
- Re-probed: Conduit `/ready` 200 (main `cf3c86c`); Resonance `/api/ready` 503 `missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"]` (main `9422def`). Open PRs before: Conduit 35 (new Bolt #283), Resonance 49. After: Conduit 33 (merged #282 → 1d478b2, #260 → acdbd5e; CI + /ready 200 after each), Resonance 48.
- Closed Resonance #194: all 3 bumps contained at identical versions in Dependabot #233.
- Kept (not contained): #178/#179 (route tests + db-error not in #202; #179 adds the parity workflow); #170 vs #184 (script vs contract test, disjoint files); #183/#193/#203 (disjoint prune sets, files still on main). Conduit Bolt #204/#267/#283 are competing rewrites of `sameRecord`: owner picks one; #272/#275/#276 unique. Conduit #119 (SSE graceful-shutdown notify not on main) and #120 (migration modules) need an owner call.
- Merge blocker: Resonance `main` requires 1 approving review; #235 and #236 are green but need the owner's approval click (no admin override used).

Merge pass 2026-10-23 10:02–10:30Z (owner-authorized merge of green, non-overlapping hardening/tests PRs):
- Fresh probes 10:02Z: Conduit `/ready` **200** (main `acdbd5e`, CI green); Resonance `/api/ready` **503** `missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"]` (main `9422def`). Open PRs before: Conduit 33, Resonance 48.
- Conduit merges in `npm run merge-train` order, squash, no admin; main CI green + `/ready` 200 after each: #245 → `fc2e762`, #261 → `31ee79f`, #207 → `461c49d`, #231 → `8bc019e` (CI https://github.com/cknowlesbadluck/Conduit/actions/runs/39937339129).
- Skipped: #278/#247 (bot findings still valid on head), #208 (2 unresolved findings: NaN TTL, no in-flight sharing), #190 (owner gate), #162/#259 (new env vars), #204/#267/#283 trio, #155, #119/#120, all owner-review-flagged PRs.
- No pure-noise audit-refresh PRs remained open to close (earlier passes already pruned them).
- #236 review findings fixed (`ba18427`): unstamped/uncomparable aliases now report `drift: null` / `verified: false`, never clean; docs show `npm run --silent alias-drift -- --json`. Still needs owner approval.
- New Conduit #284 merged → `6bc331a` (CI https://github.com/cknowlesbadluck/Conduit/actions/runs/39938650341, /ready 200): `portfolio-probe --entropy` (PR age buckets + stacked depth). Open PRs after: Conduit 29, Resonance 48.

Blunt scores (0–10) this pass:
| repo | security | reliability | tests | hygiene | ops |
|---|---|---|---|---|---|
| Conduit | 6 (DB TLS #155 still unmerged; no branch protection) | 7 (/ready 200, CI green after 4 merges) | 7 | 4 (~29 open PRs, 8 touching store.ts) | 6 (Workers Builds noise check still red everywhere) |
| Resonance | 6 (auth required, RLS PRs pending review) | 2 (prod 503 for days) | 6 | 3 (48 open PRs, review-gated) | 3 (missing prod key; Vercel aliases absent/stranger) |

Exit criteria for the next pass: Resonance `/api/ready` 200 after the owner sets the key; Resonance open PRs < 30 via owner approvals of #235/#236 and batch review; Conduit picks one of #204/#267/#283 and closes the other two; Conduit open PRs < 25; Conduit enables branch protection (require CI).

## Phase 1 — Owner gate stays external [blocked]
Exit: owner sets SUPABASE_SERVICE_ROLE_KEY in Netlify; `/api/ready` returns 200. Until then the body must stay owner-blocked and no agent invents a key.

## Phase 2 — Alias and stranger classification stay strict [in progress]
Exit: alias-drift report (#236) shows no `stranger_occupant`/`alias_absent` for Resonance-owned aliases (or they are intentionally retired and documented); tests keep 404/stranger 200 from counting as ready.

## Phase 3 — Device fence immutable [passed]
Exit (held): `deviceAcceptance=not_recorded`, `acceptanceGate=CHR-55`; claimDeviceAcceptance() rejects.

## Phase 4 — CHR-55 remains the only device gate [blocked]
Exit: archive IPA installed and validated on a real iPhone 16e; simulator/CI is never acceptance.

## Phase 5 — Conversation and memory budget [passed]
Exit (held): bounded windows; tests green; no unbounded history.

## Phase 6 — Gateway contract and free tier [passed]
Exit (held): no paid bindings; 'Workers Builds: conduit' failure is known noise, not a gate.

## Phase 7 — Hygiene prune [in progress]
Exit: < 10 open PRs per repo; one roadmap file; no dated audit files on main without PR. Next: merge-train (#260) ordering of green non-overlapping hardens; owner review of migration PRs (#207, #208, #214, #173).

## Phase 8 — Resonance control plane waits on stamp [blocked]
Exit: live `/api/ready` carries `commitSha` + `contractRevision` (#178/#202) and Phase 1 is passed.

## Phase 9 — Privacy and logging strict [passed]
Exit (held): metadata-only logs; redaction fast paths merged (Conduit #263).

## Phase 10 — Cross-plane acceptance proof [blocked]
Exit: one probe shows Conduit ready, Resonance ready + stamped at main, alias drift clear, device archive evidence. Fixtures are insufficient.

## Innovation track
1. Resonance #236 — report-only Vercel alias drift (public HTTP, +tests). 2. Conduit #282 — open-PR entropy in portfolio-probe (now injectable/timeout + test). 3. Conduit #260 — merge-train health (complementary, keep). 4. Resonance #202/#179 — deploy parity + schedule; fold alias-drift into the schedule after merge. 5. Conduit #278 — stale branch detector.

Highest-value next: owner sets the Supabase key + cleans Vercel aliases; then merge-train the green hardens to get under 10 open PRs per repo.
