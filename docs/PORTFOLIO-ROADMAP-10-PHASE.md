# Portfolio 10-phase roadmap — 2026-09-28 22:00 EDT

1. Ready-or-refuse on Resonance main — DONE (#108). Live still 503 until post-key GitHub-backed redeploy + migrations.
2. SERVICE_ROLE key exists on resonancenexus production context (updated 13:01 EDT). Exit is still `/api/ready` 200. Confirmed live miss at 22:00. Redeploy from GitHub; do not upload this sandbox.
3. Durable `github.repository.read` evidence with deny proofs. Needs live `GITHUB_TOKEN` + `GITHUB_WEBHOOK_SECRET`. Absent at 22:00. #131 is a bounded-read hardening slice and stays blocked.
4. Quicksilver device HG CHR-55 on iPhone 16e from `ae28c2f0` or later. Simulator CI is not acceptance.
5. Quicksilver M2-T1 — DONE (#188). M2-T2 — DONE (#189). Next slice after rebase of #190: M2-T3. P-T4 stays behind M3.5-T4.
6. Conduit freeze on #119/#120. Repair off current main (`4838170a` after #149) only. Do not merge red. #152 stays open while unstable.
7. Conduit #125 keyset pagination — DONE. HTTP `/diagnostics` — DONE live 200 after #143. #144 memoize and #149 sanitization are on main.
8. Resonance iOS I1 against a ready host. Blocked by phase 2 exit, not by key-name presence.
9. Chamber form/work/dissolve with audit. Blocked by phase 2.
10. Release surface: SideStore evidence, unskip production-smoke, owner prune leftover `docs/*`, `codex/*`, `bolt/*`, `develop`, `feature/ios-p4-compose-execute-evidence`, `release/0.8.0`. Archive abandoned `mcp`. No delete-ref tool on this connector.
