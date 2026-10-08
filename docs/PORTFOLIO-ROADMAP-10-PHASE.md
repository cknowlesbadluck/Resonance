# Portfolio 10-phase roadmap — 2026-10-08 14:00 EDT

Live probes at 2026-10-08T18:01:50Z. No secrets invented. A classifier is not production proof.

Evidence:
- Conduit `/health` and `/ready` 200, version 0.8.0, contractRevision `2026-10-03-ready-surface`, persistence postgres.
- Resonance public `/api/ready` 503. `missingRequired` is exactly `SUPABASE_SERVICE_ROLE_KEY`. Body omits `ownerActionRequired` and `contractRevision`.
- `resonancenexus.vercel.app` 404 `DEPLOYMENT_NOT_FOUND`, classified `alias_absent`.
- Lattice pull requests stay open and unmerged: Conduit #187, Resonance #154, QuicksilverV1 #242. Posture pin refreshed in place. No new witness.
- Do not merge Conduit #119, #120, #155, #162.
- Device acceptance remains iPhone 16e. Simulator CI is not that gate.

## Phase 0 — Owner gate
Set `SUPABASE_SERVICE_ROLE_KEY` on Netlify `resonancenexus` only. Exit: public ready is 200.

## Phase 1 — Entropy collapse
Collapse superseded witnesses. Keep-red TLS drafts stay unmerged. Exit: at most 2 open pull requests per active repo, keep-red excluded.

## Phase 2 — Ready parity
Public Netlify body carries the contract revision. Vercel status does not close the gate.

## Phase 3 — Persistence proof
Production smoke on the real 200 body at `resonancenexus`.

## Phase 4 — Idempotent execution
Duplicate requests never double-execute on main.

## Phase 5 — Adapter substitution
A second provider behind the same capability contract.

## Phase 6 — Chamber lifecycle
Form, work, dissolve, audit intact on main.

## Phase 7 — One iOS peer contract
QuicksilverV1 is the only mobile surface.

## Phase 8 — Device acceptance
iPhone 16e human gate. Not simulator CI.

## Phase 9 — Release hardening
TLS only after owner env. Privacy manifest and SideStore evidence.

Binding constraint: owner secret on Netlify. Agent work cannot close Phase 0.
