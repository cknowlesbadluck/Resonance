# Portfolio 10-phase roadmap — 2026-10-08 07:00 EDT

Live probes at 2026-10-08T11:01:18Z. No secrets invented. A ledger is not production proof. Refreshed in place on `harden/entropy-governor-2300`. No new witness pull.

Evidence:
- Conduit `/health` and `/ready` 200, version 0.8.0, `contractRevision=2026-10-03-ready-surface`, persistence postgres.
- Public `GET https://resonancenexus.netlify.app/api/ready` 503. `missingRequired` is exactly `["SUPABASE_SERVICE_ROLE_KEY"]`. Body omitted `ownerActionRequired` and `contractRevision`.
- `https://resonancenexus.vercel.app` 404 `DEPLOYMENT_NOT_FOUND`, classified `alias_absent`.
- Open Resonance pulls: #150 ready pin, #151 degrade planner, #153 entropy governor. Do not merge while required checks are red.
- Do not invent `SUPABASE_SERVICE_ROLE_KEY`. Do not switch hosts.

## Phase 1 — Owner gate
Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Exit: public `/api/ready` is 200.

## Phase 2 — Deploy-lag kill
Exit: the canonical host ready body contains `contractRevision`. A Vercel alias 404 is not that proof.

## Phase 3 — Entropy governor
Witness budget is 2. Exit: governor tests green on #153. No new status pull.

## Phase 4 — Collapse planners
#150 and #151 stay unmerged until checks are green, then one squash or an explicit close.

## Phase 5 — Device fence
Out of this repo. Simulator CI on Quicksilver is not the product gate.

## Phase 6 — Chamber fail-closed
No new provider. Exit: non-executable capability stays denied.

## Phase 7 — Hygiene prune
No hourly audit files. One roadmap file. Orphan fences deleted.

## Phase 8 — Single iOS peer
Do not start a second client. Exit: one iOS target after Phase 1.

## Phase 9 — Grants deny-by-default
Resource records hold no secrets. Exit: grant tests green.

## Phase 10 — Cross-plane acceptance
Exit: production ready 200 on `resonancenexus`, not a unit test and not a Vercel alias.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
