# Portfolio 10-phase roadmap — 2026-10-06 23:00 EDT

Live probes at 2026-10-07T03:01:29Z. No secrets invented. A classifier is not production proof.

Evidence:
- Public `GET /api/ready` returned 503. `missingRequired` is exactly `SUPABASE_SERVICE_ROLE_KEY`. Body omitted `ownerActionRequired` and `contractRevision`. `/api/health` returned 200.
- `#150` is the only ready-body pin. CI green; `github-advanced-security` failed. Do not merge while that check is red. Do not open a third ready-body change.
- `resonancenexus.vercel.app` is 404 `DEPLOYMENT_NOT_FOUND` (alias absence, not the owner gate).
- Conduit ready is 200 version 0.8.0 contractRevision 2026-10-03-ready-surface postgres.
- QuicksilverV1 device gate remains CHR-55 on iPhone 16e. Simulator CI is not that gate.
- Host posture classifier is on Conduit `#183`, not a Resonance provider. Local tests 5/5.
- Orphan Resonance branches deleted this pass: counsel/audit-fixes, counsel/ios-app-target, custom-capability-catalog, harden/admission-collapse-1000.
- Open on this repo: `#152` roadmap, `#151` degrade planner, `#150` ready pin.

## Phase 1 — Owner gate

Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Do not invent it. Exit: public `GET /api/ready` is 200 and `ownerActionRequired` is false.

## Phase 2 — Kill the split-brain deploy

`#150` stays the only ready-body pin. Exit: public Netlify body contains `contractRevision` and `ownerActionRequired`.

## Phase 3 — Admission gate

Conduit `#183` owns work admission. Resonance does not grow a second classifier. Exit: no new Resonance witness PR while `#151` or `#150` is open.

## Phase 4 — Entropy prune

Orphan branches from this pass are gone. Exit: open PR count does not rise.

## Phase 5 — Quicksilver device gate

Out of Resonance core. Exit: CHR-55 on iPhone 16e, or an owner waiver. Domain independence stays.

## Phase 6 — One degrade planner

`#151` is the Resonance copy. Merge only after CI, then close the duplicate. Exit: one implementation on main.

## Phase 7 — Chamber fail-closed stays

No new provider. Exit: chamber tests stay red-free on main.

## Phase 8 — One iOS target

Diverged iOS branches were deleted. Exit: a single app target rebuilt on current main, or no iOS app PR.

## Phase 9 — Grants stay deny-by-default

No secrets in resource records. Exit: unauthenticated production traffic stays rejected while auth mode is required.

## Phase 10 — Cross-plane acceptance

Exit: public ready 200, Conduit ready 200, and a device gate that is not a unit test.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
