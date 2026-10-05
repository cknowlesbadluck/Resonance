# Portfolio 10-phase roadmap — 2026-10-05 17:00 EDT

Live probes at 2026-10-05T21:01:54Z. No secrets invented. A classifier is not production proof.

Evidence:
- Canonical public host is `https://resonancenexus.netlify.app`. `GET /api/health` returned 200. `GET /api/ready` returned 503. `missingRequired` is exactly `SUPABASE_SERVICE_ROLE_KEY`. Body still omits `ownerActionRequired` and `contractRevision`. Auth mode required and ok. Persistence and GitHub adapter not configured.
- `https://resonancenexus.vercel.app/api/ready` returned 404 `DEPLOYMENT_NOT_FOUND`. That alias is absent. It is not the public gate and it is not an owner-gate failure.
- `https://resonance-2in3qv6ni-inbetweenz.vercel.app/api/ready` returned 302 behind Vercel Authentication. Not proof.
- Conduit `GET /health` and `GET /ready` both returned 200 with `version=0.8.0` and `contractRevision=2026-10-03-ready-surface`. Ready persistence is postgres. Diagnostics ok. Bound agent `grok`, no binding conflict. `activity_prune` removed 0.
- Conduit `#176` `#177` `#178` remain closed and unmerged. Their branches are prune candidates. Do not merge `#119` `#120` `#155` `#162` `#179`.
- Resonance `#150` is the only ready-pin PR. Do not open another witness. `#132` `#133` `#134` stay open and diverged.
- QuicksilverV1 `#234` (Workers AI adapter) is open and mergeable. Do not merge without green required CI. `#209` dependabot stays open. CHR-55 device HG remains the product gate.
- Legacy `cknowlesbadluck/Quicksilver` archive still returns integration 403. `cknowlesbadluck/mcp` is already archived.

## Phase 1 — Owner gate

Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Do not invent it. Exit: public `GET /api/ready` is 200 and `ownerActionRequired` is false.

## Phase 2 — Kill the split-brain deploy

A Vercel status, a Vercel 302, and `DEPLOYMENT_NOT_FOUND` are not the gate. Exit: public Netlify ready body contains `contractRevision` equal to `2026-10-03-owner-gate`.

## Phase 3 — Conduit contract parity

Met on the live host at 21:01Z. Exit already held: `/health` and `/ready` share version 0.8.0 and `2026-10-03-ready-surface`. Do not reopen this as an outage.

## Phase 4 — Quicksilver product gate

`#234` is not CHR-55. Merge it only if required CI is green. Exit: device HG archive IPA on iPhone 16e, or an explicit owner waiver.

## Phase 5 — Persistence proof

After Phase 1, run production smoke against the real 200 body on `resonancenexus`. Exit: smoke passes on that host, not on a Vercel alias.

## Phase 6 — Chamber fail-closed stays

No new provider. Execution stays denied when a capability is not executable. Exit: chamber tests stay red-free.

## Phase 7 — Hygiene prune

No hourly audit files. One roadmap file. Delete closed unmerged witness branches. Do not merge red drafts. Archive the legacy twin when the token can; this token cannot.

## Phase 8 — One iOS target

`#134` is the Resonance iOS target. Do not start a second client. Exit: `#134` builds on current main, or it is closed.

## Phase 9 — Grants stay deny-by-default

Conduit resource records hold no secrets. Exit: grant tests green. `#155` and `#162` stay unmerged until Render TLS env is set.

## Phase 10 — Cross-plane acceptance

One probe covers Conduit ready, public Resonance ready, and Quicksilver posture. Exit: all three green on their public hosts. A unit test is not that proof.

Binding constraint: owner secret on Netlify, plus a deploy that actually reaches that host. Agent work cannot close Phase 1.
