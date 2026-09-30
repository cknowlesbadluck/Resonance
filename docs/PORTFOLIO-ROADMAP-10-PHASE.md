# Portfolio 10-phase roadmap — 2026-09-30 16:00 EDT

1. Ready-or-refuse on main — DONE. Live still 503 until SERVICE_ROLE + GitHub-backed redeploy.
2. Owner exposes SERVICE_ROLE to the live process on resonancenexus only. Exit: `/api/ready` 200. Confirmed missing at 16:00.
3. Durable `github.repository.read` evidence with deny proofs. Bounded reads shipped on `b9c11d9b` (#131). Still needs live tokens.
4. Quicksilver device HG CHR-55 on iPhone 16e from `acbb8e87` or later after `main` is green. Simulator CI is not acceptance.
5. Quicksilver next code slice: #198 green, then M2-T4. M1 shipped. P-T4 stays behind M3.5-T4.
6. Conduit freeze; repair #119/#120 off current main (`b582429b`). Do not merge red. Do not merge #155 until Render TLS env is set.
7. Conduit #125 keyset pagination — DONE. HTTP `/diagnostics` — DONE live 200. #152 path guard is on main.
8. Resonance iOS I1 against a ready host. Blocked by phase 2.
9. Chamber form/work/dissolve with audit. Blocked by phase 2.
10. Release surface: SideStore evidence, unskip production-smoke, owner prune leftover `docs/*`, `codex/*`, `bolt/*`, `counsel/*`, `develop`, `feature/ios-p4-compose-execute-evidence`, and `release/0.8.0` branches. Archive abandoned `cknowlesbadluck/Quicksilver`. No delete-ref tool on this connector.
