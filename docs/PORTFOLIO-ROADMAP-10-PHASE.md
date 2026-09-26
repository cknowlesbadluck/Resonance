# Portfolio 10-phase roadmap — 2026-09-26 10:05 EDT

Update this file and `docs/AUDIT-2026-09-25.md` in place. Do not add hourly audit files.
CI fails any PR that reintroduces `docs/PORTFOLIO-AUDIT-YYYY-MM-DD-HHMM.md`.

1. Ready-or-refuse on main — DONE (#108). Live still 503 until SERVICE_ROLE + migrations.
2. Owner sets `SUPABASE_SERVICE_ROLE_KEY` on resonancenexus only. Exit: `/api/ready` 200. Confirmed missing at 10:05. Env list still has URL/anon/auth/project id only.
3. Durable `github.repository.read` evidence with deny proofs. Needs `GITHUB_TOKEN` + `GITHUB_WEBHOOK_SECRET`.
4. Quicksilver device HG CHR-55 on iPhone 16e from `db1ffd7d` or later. Simulator CI is not acceptance.
5. Quicksilver next code slice after HG (CHR-12 a11y or first bound AI turn). P-T1/P-T2/P-T3 shipped. P-T4 stays behind M3.5-T4.
6. Conduit freeze; repair #119/#120 off current main (`5659a495`). Do not merge red.
7. Conduit #125 keyset pagination — DONE (merged 2026-09-26T12:09:14Z).
8. Resonance iOS I1 against a ready host. Blocked by phase 2. #116/#117 closed — packaging failed.
9. Chamber form/work/dissolve with audit. Blocked by phase 2.
10. Release surface: SideStore evidence, unskip production-smoke, owner prune leftover `docs/*`, `codex/*`, and `bolt/*` branches. Archive abandoned `cknowlesbadluck/Quicksilver`.
