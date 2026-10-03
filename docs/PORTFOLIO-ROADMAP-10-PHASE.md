# Portfolio 10-phase roadmap — 2026-10-03

Live probes at 2026-10-03T09:02Z.

Evidence:
- Resonance `/api/health` 200. Production `/api/ready` 503 missing exactly `SUPABASE_SERVICE_ROLE_KEY` and still omitting `ownerActionRequired`. Preview 147 returns `ownerActionRequired: true` and `contractRevision: 2026-10-03-owner-gate`. Production is unpublished relative to that preview. #147 is mergeable but blocked by CodeRabbit `CHANGES_REQUESTED`.
- Conduit `/health` 200 without version. `/ready` 200, postgres, version 0.8.0. Express `/health` in `index.ts` never emitted version; `app-factory.ts` did. That split is a false deploy-lag signal.
- QuicksilverV1 main is `3d6331ca` after #211. Open PR is dependabot #209 only. Device HG remains CHR-55. Simulator CI is not acceptance.

## Phase 1 — Owner gate
Set `SUPABASE_SERVICE_ROLE_KEY` on resonancenexus. Do not invent it. Exit: GET `/api/ready` 200 and body includes `ownerActionRequired: false`.

## Phase 2 — Deploy lag kill
Ship the repo readiness contract (`ownerActionRequired`, `contractRevision`) so production matches code. Exit: live ready body contains `contractRevision`.

## Phase 3 — Conduit header hardening
Permissions-Policy, CORP, request id, version on `/health`. Exit: live `/health` returns version and the new headers.

## Phase 4 — Quicksilver fail-closed posture
`PortfolioPosture` parses both the deployed 503 body and the newer contract. Exit: unit tests green; device build still not claimed.

## Phase 5 — Persistence proof
After Phase 1, run production smoke against the real 200 body. Exit: smoke script passes on the production host.

## Phase 6 — Chamber fail-closed stays
No new provider. Execution remains denied when a capability is not executable. Exit: existing chamber tests stay red-free.

## Phase 7 — Hygiene prune
No hourly audit files. One roadmap file per repo, updated in place. Stale preview secrets revoked by the owner.

## Phase 8 — iOS cockpit only after the app target is green
Do not start a second client. Exit: existing Quicksilver/Resonance iOS target builds, or the blocking issue is closed.

## Phase 9 — Grant and bridge audit
Conduit grants stay deny-by-default. Re-check path patterns and SSRF guards. Exit: grant tests green.

## Phase 10 — Cross-plane acceptance
One probe covers Conduit ready, Resonance ready, and Quicksilver posture parse. Exit: all three green on production, not on a preview.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
