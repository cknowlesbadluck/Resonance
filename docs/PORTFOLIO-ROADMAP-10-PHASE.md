# Portfolio 10-phase roadmap — 2026-10-10 13:00 EDT

Live probes at 2026-10-10T17:01Z. No secrets invented. Classifier tests are not production proof. Hygiene: one roadmap file. Did not merge held PRs. Innovation track continues.

Evidence (fresh):
- Resonance public host `GET https://resonancenexus.netlify.app/api/ready` 503 missing exactly ["SUPABASE_SERVICE_ROLE_KEY"]. Body omits ownerActionRequired and contractRevision (deploy lag + owner gate). Timestamp 2026-10-10T17:01:03.027Z. Health 200 stage=deployment.
- Conduit /health and /ready 200, version=0.8.0, contractRevision=2026-10-03-ready-surface, persistence=postgres.
- QuicksilverV1 gateway unresolved. deviceAcceptance=not_recorded. Gate is CHR-55 real iPhone 16e archive IPA.
- Held: #154/#157/#158/#159/#160 open. Dependabot critical tinypool RCE (prototype pollution), high sharp, medium next.
- Conduit critical proxy-addr hygiene #192 open.

## Phase 1 — Owner gate
Set SUPABASE_SERVICE_ROLE_KEY on Netlify site resonancenexus only. Do not invent it. Exit: public GET /api/ready is 200 and ownerActionRequired is false.

## Phase 2 — Deploy lag kill
Main stamps contractRevision and ownerActionRequired. Production does not. Exit: the Netlify ready body contains both fields.

## Phase 3 — Conduit contract stay
Live health and ready share version and contract revision. Do not open another health-stamp PR. Exit: next probe still matches 2026-10-03-ready-surface.

## Phase 4 — Quicksilver device fence stay
Gateway health keeps deviceAcceptance=not_recorded. Exit: CHR-55 remains the only acceptance record (iPhone 16e archive IPA).

## Phase 5 — Persistence proof
After Phase 1, run production smoke against the real 200 body. Exit: smoke passes on resonancenexus.

## Phase 6 — Chamber fail-closed stays
No new provider. Execution denied when capability not executable. Exit: chamber tests green.

## Phase 7 — Hygiene prune executed
One roadmap file. Stale audits pruned. Critical Dependabot (tinypool) must be addressed before any new feature work. package-lock regen pending if needed. Legacy Quicksilver archived.

## Phase 8 — iOS cockpit only after the public contract is live
No second client until Phase 2 is visible on Netlify.

## Phase 9 — Grants stay deny-by-default
A resource record is not a grant. Exit: grant tests green and no resource record holds a secret.

## Phase 10 — Cross-plane acceptance
One probe covers Conduit health, Conduit ready, and Resonance ready. Exit: production verdict accepted. Fixture test is not that proof.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 1.

## Innovation Track (executable now)
1. Close critical tinypool prototype-pollution RCE alerts by bumping to >=2.1.2; high sharp to >=0.35.5; evaluate next cache-poisoning non-breaking path.
2. Verify and potentially merge chamber dissonance audit (#157) if tests green and no gate impact.
3. Pure PortfolioPosture classifier shared or mirrored; no secrets.
4. Lockfile regen and CI green after any audit fixes.
5. Unified portfolio probe consistency with QuicksilverV1 and Conduit.
6. On-device read-only capability discovery deferred until ready 200.
7. Adversarial review of lattice #154 before merge.
8. Confirm vitest 4 bump stability.
9. Hygiene: consolidate docs refreshes.
10. Fail-closed on any new provider or execution path.

Audit note: Full audit completed at 13:00 EDT. Stabilization holds. Innovation starts with security hardening of critical RCE surfaces. No secret invention.
