# Portfolio 10-phase roadmap — 2026-10-03 10:00 EDT

Live probes at 2026-10-03T14:01:34Z. No secrets invented. A fixture is not production proof.

Evidence:
- Resonance `GET /api/ready` returned 503. Body: `{"status":"not_ready","service":"resonance-nexus","stage":"deployment","production":true,"authMode":"required","authModeOk":true,"persistenceConfigured":false,"githubAdapterConfigured":false,"missingRequired":["SUPABASE_SERVICE_ROLE_KEY"],"timestamp":"2026-10-03T14:01:34.741Z"}`. Omitted `ownerActionRequired` and `contractRevision`. Owner gate plus deploy lag. Preview on #147 serializes both fields. Do not treat this document as the production response.
- Conduit `GET /health` returned 200 `{"status":"ok","service":"conduit","version":"0.8.0","contractRevision":"2026-10-03-health-parity"}`. `GET /ready` returned 200 `{"status":"ready","service":"conduit","version":"0.8.0","persistence":"postgres"}` and omitted `contractRevision`. #171 squash-merged at 8e5cecf3 to stamp `/ready`. Live `/ready` stays unstamped until Render deploys that commit. The merge is not production proof.
- QuicksilverV1 #216 (GatewayAIProvider SSE) is the open product PR. Simulator CI is not device acceptance (CHR-55).

## Phase 1 — Owner gate

Set `SUPABASE_SERVICE_ROLE_KEY` on resonancenexus. Do not invent it. Exit: GET `/api/ready` 200 and `ownerActionRequired` is false.

## Phase 2 — Deploy lag kill

Land #147 only after CodeRabbit clears the stale-revision test. Exit: live ready body contains `contractRevision` equal to `2026-10-03-owner-gate`.

## Phase 3 — Conduit ready surface on the host

#171 is on main. Exit: live `/health` and `/ready` share one `contractRevision` after Render deploys 8e5cecf3.

## Phase 4 — Quicksilver gateway transport

Merge #216 only if UI smoke and required jobs are green. Exit: SSE client on main. Device HG still not claimed.

## Phase 5 — Persistence proof

After Phase 1, run production smoke against the real 200 body. Exit: smoke passes on the production host.

## Phase 6 — Chamber fail-closed stays

No new provider. Execution remains denied when a capability is not executable. Exit: existing chamber tests stay red-free.

## Phase 7 — Hygiene prune

No hourly audit files. One roadmap file per repo. Do not merge #119, #120, or #155. Archive `cknowlesbadluck/Quicksilver`; close still returns 403 to this token.

## Phase 8 — iOS cockpit only after the app target is green

Do not start a second client. Exit: Resonance #134 builds, or it is closed.

## Phase 9 — Grant and bridge audit

Grants stay deny-by-default. Exit: grant tests green and no resource record holds a secret.

## Phase 10 — Cross-plane acceptance

One probe covers Conduit health, Conduit ready, and Resonance ready. Exit: production verdict accepted. A fixture test is not that proof.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.
