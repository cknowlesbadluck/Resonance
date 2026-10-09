# Portfolio 10-phase roadmap — 2026-10-09 08:02 EDT

Live probes at 2026-10-09T12:02:13Z. No secrets invented. A classifier test is not production proof. This pass did not merge the cutover-lattice PRs.

Evidence:
- Resonance public host `GET https://resonancenexus.netlify.app/api/ready` returned **503**. Body: `status=not_ready`, `missingRequired=[SUPABASE_SERVICE_ROLE_KEY]`, `authMode=required`, `authModeOk=true`, `persistenceConfigured=false`, `githubAdapterConfigured=false`. Body omitted `ownerActionRequired` and `contractRevision`. Source on main already stamps both. That is owner gate plus deploy lag.
- `https://resonanceplane.vercel.app/api/ready` returned **404** `DEPLOYMENT_NOT_FOUND`. Alias absent. Not the owner gate.
- Conduit `GET https://conduit-feco.onrender.com/health` and `/ready` both returned 200, `version=0.8.0`, `contractRevision=2026-10-03-ready-surface`, ready `persistence=postgres`. Header parity holds. Not a grant or TLS proof.
- QuicksilverV1 main includes the device-acceptance fence (`deviceAcceptance=not_recorded`, gate CHR-55). `mercury-gateway.cknowlesbadluck.workers.dev` did not resolve. Simulator CI is not device acceptance.
- Open and held: QuicksilverV1 #242 and #209, Resonance #154 and #155, Conduit #187 #188 #162 #155 #120 #119. Lattice PRs say do not merge. Conduit #119/#120 stay draft red. Conduit #155 stays unmerged until the Render TLS env is set.

## Phase 1 — Owner gate
Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Do not invent it. Exit: public `GET /api/ready` is 200 and `ownerActionRequired` is false.

## Phase 2 — Deploy lag kill
Main already stamps `contractRevision` and `ownerActionRequired`. Production does not. Exit: the Netlify ready body contains both fields. A Vercel 404 does not count.

## Phase 3 — Conduit contract stay
Live health and ready already share version and contract revision. Do not open another health-stamp PR. Exit: the next probe still matches `2026-10-03-ready-surface`.

## Phase 4 — Quicksilver device fence stay
Gateway health must keep `deviceAcceptance=not_recorded`. Exit: CHR-55 remains the only acceptance record, and it is still an iPhone 16e archive IPA, not a unit test.

## Phase 5 — Persistence proof
After Phase 1, run production smoke against the real 200 body. Exit: smoke passes on `resonancenexus`, not a Vercel alias.

## Phase 6 — Chamber fail-closed stays
No new provider. Execution stays denied when a capability is not executable. Exit: chamber tests stay red-free on main.

## Phase 7 — Hygiene prune
No hourly audit files. One roadmap file per repo. Do not merge #119, #120, or Conduit #155. Lattice PRs stay open until a session verifies them inside the target repo. Legacy `cknowlesbadluck/Quicksilver` is archived and is not the product.

## Phase 8 — iOS cockpit only after the public contract is live
Do not start a second client. Resonance iOS work waits until Phase 2 is visible on Netlify.

## Phase 9 — Grants stay deny-by-default
A resource record is not a grant. Exit: grant tests green and no resource record holds a secret.

## Phase 10 — Cross-plane acceptance
One probe covers Conduit health, Conduit ready, and Resonance ready. Exit: production verdict accepted. A fixture test is not that proof.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
