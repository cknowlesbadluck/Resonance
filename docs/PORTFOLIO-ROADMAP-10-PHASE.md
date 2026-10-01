# Portfolio 10-phase roadmap — 2026-10-01 10:00 EDT

Observed this pass. Not a release claim.

1. Freeze red work. Do not merge Quicksilver #201 while UI smoke is red. Do not merge Resonance #141 while GHAS is red. Do not merge Conduit #162 while Workers Builds is red. Do not merge #119, #120, #155, #193, #132, #133, #134.
2. Owner sets `SUPABASE_SERVICE_ROLE_KEY` on Netlify site `resonancenexus` only. Exit: `GET /api/ready` returns 200. Live probe this pass: 503, missing exactly that key. Auth mode required and ok. Persistence and GitHub adapter not configured.
3. Apply `supabase/migrations` on that same project. Exit: an execution row survives a process restart. Blocked by phase 2.
4. Scoped `GITHUB_TOKEN` plus `GITHUB_WEBHOOK_SECRET`. Exit: `github.repository.read` evidence and a deny proof. Blocked by phase 2.
5. Quicksilver device HG CHR-55 on iPhone 16e from `22d37ebc` or later. Simulator CI is not acceptance. Still open.
6. Quicksilver agent slice: 44pt Sanctum invoke hit target landed on `feat/memory-text-rank` at `42727a64` after UI smoke failed on `c3bfd27a` with "Hit area is too small" in `testSanctumAccessibilityAudit`. Exit: UI smoke green on that branch, then squash #201. SPM and Simulator Build were already green.
7. Conduit stays 0.8.0 postgres ready. #162 TLS and HMAC cursors wait for Render env. #119 and #120 stay draft red. Exit: TLS verify on without an outage, or the PR stays closed.
8. Resonance iOS I0/I1 against a ready host. #134 is not the merge. Exit: one capability model and a buildable app target on main. Blocked by phase 2.
9. Chamber form, work, dissolve with durable audit. Exit: chamber test on the service-role store, not the in-memory demo. Blocked by phase 2.
10. Release surface. Archive abandoned `cknowlesbadluck/Quicksilver` and already-archived `mcp`. Close Studio PRs #1 and #2. Prune `docs/hygiene-*`, `bolt/*`, `codex/*`, `develop`, and `release/0.8.0` only after their open PRs are closed. This connector could not close the Studio PRs (403). Exit: open PR count at or below 2 per live repo, legacy repo archived.

Classifier: `src/nexus/portfolioGate.ts`. It does not set secrets and does not treat a green simulator as device acceptance.
