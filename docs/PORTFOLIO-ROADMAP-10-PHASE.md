# Portfolio 10-phase roadmap — 2026-09-26 06:03 EDT

Update this file and `docs/AUDIT-2026-09-25.md` in place. Do not add hourly audit files.
CI fails any PR that reintroduces `docs/PORTFOLIO-AUDIT-YYYY-MM-DD-HHMM.md`.

1. Ready-or-refuse on main — DONE (#108). Live still 503 until SERVICE_ROLE + migrations.
2. Owner sets `SUPABASE_SERVICE_ROLE_KEY` on resonancenexus only. Exit: `/api/ready` 200. Confirmed missing at 06:03 (env list has URL/anon/auth/project id only).
3. Durable `github.repository.read` evidence with deny proofs. Needs `GITHUB_TOKEN` + `GITHUB_WEBHOOK_SECRET`.
4. Quicksilver device HG CHR-55 on iPhone 16e. Simulator CI is not acceptance.
5. Quicksilver next code slice after HG (CHR-12 a11y or first bound AI turn). P-T2 shipped (#157).
6. Conduit freeze; repair #119/#120 off current main (`c33beed2`). Do not merge red. #132 closed.
7. Conduit #125 after rebase onto current main + required verify + postgres-coordination. Ignore Workers Builds.
8. Resonance iOS I1 against a ready host. Blocked by phase 2.
9. Chamber form/work/dissolve with audit. Blocked by phase 2.
10. Release surface: SideStore evidence, unskip production-smoke, owner prune leftover `docs/*`, `codex/*`, and `bolt/*` branches.
