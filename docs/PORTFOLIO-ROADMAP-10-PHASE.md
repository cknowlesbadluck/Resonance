# Portfolio 10-phase roadmap — 2026-10-05 20:00 EDT

Live probes at 2026-10-06T00:01:39Z. No secrets invented. A classifier is not production proof.

Evidence:
- Conduit `GET /health` and `GET /ready` returned 200, version `0.8.0`, `contractRevision=2026-10-03-ready-surface`, persistence `postgres`.
- Resonance public `GET https://resonancenexus.netlify.app/api/ready` returned 503. `missingRequired` is exactly `SUPABASE_SERVICE_ROLE_KEY`. Body omitted `ownerActionRequired` and `contractRevision`. `/api/health` returned 200.
- `https://resonancenexus.vercel.app/api/ready` returned 404 `DEPLOYMENT_NOT_FOUND`. That is `alias_absent`, not an owner gate.
- QuicksilverV1 `#235` (M3-T20 gateway router) is open. Simulator build, SPM, SwiftLint, and structure were green; UI smoke was still running at probe time. Do not merge while smoke is pending. Main is `54328c6d` (`#234` Workers AI).
- Resonance `#150` was red on `npm run typecheck` (`TS7016` importing `scripts/public-ready-pin.mjs`). This branch adds the declaration file. Do not merge while typecheck is red.
- Conduit `#119` `#120` `#155` `#162` `#179` stay unmerged. `#155` is explicitly do-not-merge until Render TLS env is set.
- Legacy `cknowlesbadluck/Quicksilver` `#1` and `#2` were still open. Archive attempts have returned 403. `mcp` is already archived.
- `activity_prune` removed 0 rows.

## Phase 1 — Owner gate
Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Do not invent it. Exit: public `GET /api/ready` is 200.

## Phase 2 — Kill the split-brain deploy
Vercel 404 is not the gate. Exit: public Netlify body contains `contractRevision` equal to `2026-10-03-owner-gate` and `ownerActionRequired`.

## Phase 3 — Conduit contract parity
Met on the live host at 00:01Z. Do not reopen this as an outage.

## Phase 4 — Quicksilver gateway router
Merge `#235` only if UI smoke is green. Exit: M3-T20 on main.

## Phase 5 — Persistence proof
After Phase 1, run production smoke against the real 200 body on `resonancenexus`.

## Phase 6 — Chamber fail-closed stays
No new provider. Execution stays denied when a capability is not executable.

## Phase 7 — Hygiene prune
No hourly audit files. Red drafts stay unmerged. Archive the legacy twin when the token can.

## Phase 8 — One iOS target
`#134` is stale against main. Rebase and build it, or close it. Do not start a second client.

## Phase 9 — Grants stay deny-by-default
Conduit resource records hold no secrets.

## Phase 10 — Cross-plane acceptance
One live probe covers Conduit ready, public Resonance ready, and Quicksilver posture. A unit test is not that proof.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
