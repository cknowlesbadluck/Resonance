# Portfolio 10-phase roadmap — 2026-10-09 09:00 EDT

Live probes at 2026-10-09T13:02:05Z. No secrets invented. A classifier test is not production proof. This pass did not merge lattice pulls.

Evidence:
- Resonance `GET https://resonancenexus.netlify.app/api/ready` returned 503. Body missing exactly `SUPABASE_SERVICE_ROLE_KEY`. `ownerActionRequired` and `contractRevision` omitted on the host. `/api/health` was 200.
- `https://resonancenexus.vercel.app/api/ready` returned 404 `DEPLOYMENT_NOT_FOUND`. Classified `alias_absent`. Not the owner gate.
- Conduit `/health` and `/ready` returned 200, version `0.8.0`, contractRevision `2026-10-03-ready-surface`, persistence `postgres`.
- QuicksilverV1 #243 squash-merged at `8bc9b571`. Alias-absent classification is on main. CHR-55 is still the only device gate.
- Held: Conduit #119 #120 #155 #162, Conduit #188, lattice #187 #154 #242, Dependabot #209. `release/0.8.0` is hold-not-delete.
- Pruned: Resonance closed-unmerged head `chore/retire-client-only-capability-shape-2342893878072645481` after confirming `lib/integrations.ts` is already absent on main.

## Phase 1 — Owner persistence gate
Unpause Resonance Supabase, then set `SUPABASE_SERVICE_ROLE_KEY` on Netlify `resonancenexus` only. Do not invent it. Exit: public `GET /api/ready` is 200.

## Phase 2 — Deploy lag kill
Production ready body carries `contractRevision` and `ownerActionRequired`. A Vercel 404 does not count. Exit: live body matches the source contract.

## Phase 3 — Entropy collapse
Discretionary open pulls at or under 2 per active repo. Automation holds and keep-red do not count. Exit: lattice pulls merged or closed only after Phase 1, and no new witness pull.

## Phase 4 — Persistence proof
Apply `supabase/migrations` on the unpaused project. Exit: production smoke against `resonancenexus`.

## Phase 5 — Idempotent execution
Duplicate requests do not double-execute. Exit: Idempotency-Key replay does not double-write on the production host.

## Phase 6 — Chamber dissolve invariant
Dissonance may dissolve a work chamber and must leave an audit token. A watch chamber cannot dissolve. Exit: `chamber-dissolve` tests green. Durable evidence still waits on Phase 4.

## Phase 7 — Adapter substitution stay
GitHub, Linear, HTTP, and MCP adapters already sit behind the nexus port. Exit: a substitution test stays green and core does not import a vendor SDK.

## Phase 8 — iOS peer contract
One capability model on web and iOS. Do not revive closed cockpit pulls. Exit: contract test fails if the iOS model diverges.

## Phase 9 — Device acceptance
Owner records the iPhone 16e archive IPA. Simulator CI and gateway health are not CHR-55.

## Phase 10 — Release hardening
Postgres TLS and signed cursors only after the owner sets the Render env. Keep-red #155 and #162 stay unmerged until then. `release/0.8.0` is hold, not delete.

Binding constraint: owner persistence gate. Agent work cannot close Phase 1 or CHR-55.
