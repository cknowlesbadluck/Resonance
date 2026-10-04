# Portfolio 10-phase roadmap — 2026-10-03 22:00 EDT

Live probes at 2026-10-04T02:00:45Z. No secrets invented. Refreshed in place on #149. Do not open another roadmap PR.

Evidence:
- Public `GET /api/ready` returned **503** with `missingRequired=[SUPABASE_SERVICE_ROLE_KEY]`. Body omitted `ownerActionRequired` and `contractRevision`. `authMode=required`, `authModeOk=true`, `persistenceConfigured=false`, `githubAdapterConfigured=false`.
- Public `GET /api/health` returned **200**.
- Conduit `/health` and `/ready` both **200**, version `0.8.0`, `contractRevision=2026-10-03-ready-surface`, postgres.
- Open Resonance pulls: #149 this roadmap, #134 iOS app target, #133 audit fixes, #132 custom catalog. Do not add a fifth.

## Phase 1 — Owner gate

Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Do not invent it. Exit: public `/api/ready` is 200.

## Phase 2 — Public contract stamp

Source on main is ahead of the public body. Exit: public ready body includes `contractRevision` and is not a Vercel alias.

## Phase 3 — Conduit parity

Already live. Not a Resonance task.

## Phase 4 — Quicksilver device gate

Out of this repo. Simulator green is not device acceptance.

## Phase 5 — Open-PR freeze

Four open pulls is already over a budget of 3. Exit: #132/#133/#134 rebase or close before any new feature branch.

## Phase 6 — Persistence proof

Apply `supabase/migrations` only after the service role exists. Exit: smoke on `resonancenexus` with `persistenceConfigured=true`.

## Phase 7 — Hygiene

No new hourly audit markdown. Update this file in place.

## Phase 8 — One iOS target

#134 is the only iOS app-target PR. Exit: it builds in CI or it is closed.

## Phase 9 — Adapter substitution stays provider-neutral

No Resonance core import of a vendor SDK. Exit: capability model remains one type.

## Phase 10 — Cross-plane acceptance

Exit: Conduit ready, Resonance ready, and Quicksilver device HG all green. A classifier unit test is not that proof.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
