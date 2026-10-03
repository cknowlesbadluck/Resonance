# Portfolio 10-phase roadmap — 2026-10-03 16:00 EDT

Live probes at 2026-10-03T20:01:23Z. No secrets invented.

Evidence:
- `GET /api/ready` on `https://resonancenexus.netlify.app` returned 503. Missing exactly `SUPABASE_SERVICE_ROLE_KEY`. Body omitted `ownerActionRequired` and `contractRevision`.
- `GET /api/health` returned 200.
- Conduit `/health` and `/ready` returned 200 with `version=0.8.0` and `contractRevision=2026-10-03-ready-surface`. That is a later exit, not the binding constraint.
- Open on this repo: #149 this roadmap, #134 iOS app target, #133 audit fixes, #132 custom catalog. Do not merge over red required CI.

## Phase 1 — Owner gate

Set `SUPABASE_SERVICE_ROLE_KEY` on existing Netlify site `resonancenexus` (`7fc56cb3-d5f7-4bb2-8986-a733b8cfd548`). Do not invent it. Do not switch hosts. Exit: `/api/ready` is 200 and `missingRequired` is empty.

## Phase 2 — Deploy lag kill

Production ready body must include the current `contractRevision`. A successful deployment on a Vercel alias is not the public gate. Exit: public ready body carries the stamp.

## Phase 3 — Conduit parity

Satisfied ahead on the live Conduit host. Not a Resonance exit.

## Phase 4 — Quicksilver device gate

CHR-55 remains the product gate. Out of scope for this repo.

## Phase 5 — Persistence proof

Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql` only after Phase 1. Exit: production smoke on `resonancenexus`.

## Phase 6 — Chamber fail-closed stays

No new provider this cycle. Exit: non-executable capabilities stay denied.

## Phase 7 — Hygiene prune

Update this file in place. Do not add hourly audit files. #132, #133, and #134 need a rebase-or-close decision before more feature branches.

## Phase 8 — One iOS target

#134 is the only app-target candidate. Exit: it builds in CI or it is closed. No second client.

## Phase 9 — Adapter scope

GitHub adapter stays unconfigured until the owner sets a scoped token. Do not invent `GITHUB_TOKEN`.

## Phase 10 — Cross-plane acceptance

Web and iOS both run intent, plan, approval, execute, evidence. Exit is not met. A unit test is not this proof.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
