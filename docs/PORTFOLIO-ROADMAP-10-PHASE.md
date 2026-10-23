# Portfolio 10-phase roadmap — refreshed 2026-10-23 08:10 UTC (hygiene prune + innovate)

Status tags: **[passed]** · **[in progress]** · **[blocked]** (owner action). Agents never apply migrations, change prod config, store secrets, or spend money.

Live evidence 2026-10-23T08:02Z (public HTTP / gh):
- Conduit `https://conduit-feco.onrender.com/ready`: **200**. main `cf3c86c`, CI success https://github.com/cknowlesbadluck/Conduit/actions/runs/39547238369.
- Resonance `https://resonancenexus.netlify.app/api/ready`: **503** `not_ready`, `missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"]`, authMode required. main `9422def`, CI success https://github.com/cknowlesbadluck/Resonance/actions/runs/39547210514.
- Vercel aliases (`npm run alias-drift`, #236): resonance.vercel.app 200 `stranger_occupant`; resonancenexus/resonanceplane.vercel.app 404 `alias_absent`. Drift = owner Vercel dashboard action.
- Open PRs after this pass: Conduit 34 (closed #255 dup of merged #263, #281 superseded by #282), Resonance 47 + #236 new (closed #234 superseded by #235). Earlier "~30/~28" figures were undercounts.
- Merged since 2026-10-17: Conduit #248–#254, #262, #263, #268, #269, #274; Resonance #218, #231.
- QuicksilverV1 not probed in this pass (out of scope).

Hygiene pass 2026-10-23T09:15Z (diff-verified against main and each other):
- Re-probed: Conduit `/ready` 200 (main `cf3c86c`); Resonance `/api/ready` 503 `missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"]` (main `9422def`). Open PRs before: Conduit 35 (new Bolt #283), Resonance 48.
- Closed Resonance #194: all 3 bumps contained at identical versions in Dependabot #233.
- Kept (not contained): #178/#179 (route tests + db-error not in #202; #179 adds the parity workflow); #170 vs #184 (script vs contract test, disjoint files); #183/#193/#203 (disjoint prune sets, files still on main). Conduit Bolt #204/#267/#283 are competing rewrites of `sameRecord`: owner picks one; #272/#275/#276 unique. Conduit #119 (SSE graceful-shutdown notify not on main) and #120 (migration modules) need an owner call.
- Merge blocker: Resonance `main` requires 1 approving review; #235 and #236 are green but need the owner's approval click (no admin override used).

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
