# Portfolio 10-phase roadmap — 2026-09-30 23:03 EDT

1. Ready-or-refuse on main — DONE. Live `/api/ready` 503 on deploy `6ab8ea11`. `missingRequired` is exactly `SUPABASE_SERVICE_ROLE_KEY`. Auth mode required and ok. Do not invent the secret. Do not Netlify-deploy from the sandbox.
2. Owner exposes SERVICE_ROLE to the live process on resonancenexus only, then GitHub-backed production redeploy. Exit: `/api/ready` 200. CHR-54. Still open.
3. Durable `github.repository.read` evidence with deny proofs. Bounded reads shipped on `b9c11d9b` (#131). Still needs live tokens.
4. Quicksilver device HG CHR-55 on iPhone 16e after `main` is green. Simulator CI is not acceptance.
5. Quicksilver code: #198 `955585a` hardens the UI smoke terminate race. Do not squash until the new checks are green. Then M2-T6. #193 stays behind main.
6. Conduit freeze; repair #119/#120 off current main (`b582429b`). Do not merge red. Do not merge #155 until Render TLS env is set.
7. Conduit #125 keyset pagination — DONE. HTTP `/diagnostics` — DONE live 200. #152 path guard and #156 eviction are on main. `activity_prune` removed 0 rows this pass.
8. Resonance iOS I1 against a ready host. Blocked by phase 2. #134 not merged ahead of ready.
9. Chamber form/work/dissolve with audit. Blocked by phase 2.
10. Release surface: SideStore evidence, unskip production-smoke, owner prune leftover `docs/*`, `codex/*`, `bolt/*`, `counsel/*`, `develop`, `feature/ios-p4-compose-execute-evidence`, and `release/0.8.0`. Archive abandoned `cknowlesbadluck/Quicksilver`. No delete-ref tool on this connector.

## Innovative implementations

A. QS #198 smoke harness no longer relaunches into the Xcode 26 terminate race.
B. PR #139 `feat/ready-live-shape` locks the exact live 503 body. Fixture only.
C. Conduit TLS verify stays on #155 until Render env is set. Not merged.
