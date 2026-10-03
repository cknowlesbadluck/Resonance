# Portfolio 10-phase roadmap — 2026-10-03 12:00 EDT

Live probes at 2026-10-03T16:02:31Z. No secrets invented. A classifier is not production proof.

Evidence:
- Resonance `GET https://resonancenexus.netlify.app/api/ready` returned 503. Body omitted `ownerActionRequired` and `contractRevision`. `missingRequired` is exactly `SUPABASE_SERVICE_ROLE_KEY`. Auth mode required and ok. Persistence and GitHub adapter not configured.
- `#147` squash-merged at `a9331e6b` (15:02Z). GitHub production deployment `6829196191` reports success against `https://resonance-2in3qv6ni-inbetweenz.vercel.app`. That alias is not the public gate. Netlify is still the old contract. Deploy lag plus owner gate.
- Conduit `GET /health` and `GET /ready` both returned 200 with `version=0.8.0` and `contractRevision=2026-10-03-ready-surface`. Ready persistence is postgres. Diagnostics ok. Bound agent `grok`, no binding conflict.
- QuicksilverV1 main is `5eb30beb` (`#216` SSE client). `#217` (M3-T4 routing config) is open, mergeable, required jobs green except iOS Simulator Build and UI smoke still running at probe time. Do not merge while those are pending. CHR-55 device HG remains the product gate.
- Legacy `cknowlesbadluck/Quicksilver` close still returns integration 403. Do not merge Conduit `#119`, `#120`, `#155`, `#162`.

## Phase 1 — Owner gate

Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Do not invent it. Exit: public `GET /api/ready` is 200 and `ownerActionRequired` is false.

## Phase 2 — Kill the split-brain deploy

`#147` is on main. The remaining defect is host identity: a Vercel production status must not close the gate. Exit: public Netlify ready body contains `contractRevision` equal to `2026-10-03-owner-gate`.

## Phase 3 — Conduit contract parity

Met on the live host at 16:01Z. Exit already held: `/health` and `/ready` share version 0.8.0 and `2026-10-03-ready-surface`. Do not reopen this as an outage.

## Phase 4 — Quicksilver routing config

Merge `#217` only if Simulator Build and UI smoke are green. Exit: M3-T4 on main. Device HG still open.

## Phase 5 — Persistence proof

After Phase 1, run production smoke against the real 200 body on `resonancenexus`. Exit: smoke passes on that host, not on a Vercel alias.

## Phase 6 — Chamber fail-closed stays

No new provider. Execution stays denied when a capability is not executable. Exit: chamber tests stay red-free.

## Phase 7 — Hygiene prune

No hourly audit files. One roadmap file. Do not merge red drafts. Archive the legacy twin when the token can; this token cannot.

## Phase 8 — One iOS target

`#134` is diverged (ahead 1, behind 7). Do not start a second client. Exit: `#134` builds on current main, or it is closed.

## Phase 9 — Grants stay deny-by-default

Conduit resource records hold no secrets. Exit: grant tests green.

## Phase 10 — Cross-plane acceptance

One probe covers Conduit ready, public Resonance ready, and Quicksilver posture parse. Exit: all three green on their public hosts. A unit test is not that proof.

Binding constraint: owner secret on Netlify, plus a deploy that actually reaches that host. Agent work cannot close Phase 1.
