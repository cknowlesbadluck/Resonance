# Portfolio 10-phase roadmap — 2026-10-07 13:00 EDT

Live probes at 2026-10-07T17:01:14Z. No secrets invented. A classifier is not production proof.

Evidence:
- Conduit `GET /health` and `GET /ready` returned 200, version `0.8.0`, `contractRevision` `2026-10-03-ready-surface`, persistence `postgres`.
- Public `GET /api/ready` returned 503. Body: `missingRequired` exactly `["SUPABASE_SERVICE_ROLE_KEY"]`. Omitted `ownerActionRequired` and `contractRevision`. `GET /api/health` returned 200.
- `resonancenexus.vercel.app` returned 404 `DEPLOYMENT_NOT_FOUND`. Alias absence, not the owner gate.
- Stack collapse refreshes this record. `#150` stays unmerged while required checks are red. `#151` stays open; it is a different theme, not a duplicate of this roadmap.
- Conduit `#119` `#120` `#155` `#162` stay unmerged. `#183` stays unmerged because Workers Builds is red.
- Legacy Quicksilver archive is owner-only. `activity_prune` removed 0. No new pull request.

## Phase 1 — Owner gate

Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Do not invent it. Exit: public `GET /api/ready` is 200 and `ownerActionRequired` is false.

## Phase 2 — Single ready-body pin

`#150` is the only ready-body pin. Exit: public body contains `contractRevision` and `ownerActionRequired`, and required checks are green before merge.

## Phase 3 — Coordination host stamp

Done on the live Conduit host.

## Phase 4 — Stack collapse

This branch is the Resonance roadmap refresh target. Exit: no new pull request while the owner gate is open.

## Phase 5 — Alias classification

Done. Exit: 404 `DEPLOYMENT_NOT_FOUND` stays `alias_absent`.

## Phase 6 — Keep-red fence

Conduit `#119` `#120` `#155` `#162` stay unmerged.

## Phase 7 — Hygiene prune

One roadmap file. No hourly audit file. Exit: `activity_prune` has run.

## Phase 8 — Device gate stays outside this repo

QuicksilverV1 CHR-55 on iPhone 16e. Simulator CI is not that gate.

## Phase 9 — Deny-by-default grants

No secrets in resource records. Bridge calls stay denied without a grant.

## Phase 10 — Cross-plane acceptance

Exit: Conduit ready 200, this public ready 200, and a device gate that is not a unit test.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
