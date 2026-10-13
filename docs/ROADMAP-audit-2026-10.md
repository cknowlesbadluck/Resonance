# Resonance — Audit Roadmap (2026-10-13)

Source: full audit on 2026-10-13 (CI, workflows, deps, Supabase, Next.js routes, secrets history, hygiene).
Baseline: main CI red (lockfile drift), 0 vulns after lock resync, 187 tests pass, strict TS on, RLS on all 28 tables, gitleaks clean (one fake test JWT in `src/leak-fence.test.ts`).

| # | Phase | Goal | Deliverables | Exit criteria | Risk |
|---|-------|------|--------------|---------------|------|
| 1 | Stabilize CI | main green, supply chain pinned | Lockfile resync (#161); SHA-pinned actions, Gemini trigger gating, least privilege (#162); Dependabot for actions+npm | 3 consecutive green main runs; all `uses:` SHA-pinned | Low |
| 2 | Branch/PR hygiene | Stop branch & doc sprawl | Triage 15 stale branches, decide on #154/#157/#158/#159; stop timestamped roadmap/audit branches; consolidate docs/ROADMAP*, PORTFOLIO-*, AUDIT-* | ≤5 live branches; one roadmap doc | Low |
| 3 | Branch protection & policy | Prevent red/direct pushes to main | Require PR + `CI` check on main; CODEOWNERS; no direct pushes (owner approval) | Direct push to main rejected | Low (settings, needs approval) |
| 4 | Auth fail-closed | No silent auth bypass in prod | `RESONANCE_AUTH_MODE` defaults to `required` when `NODE_ENV=production`; startup assertion; tests for every route x mode | Route auth matrix tests pass; prod refuses `optional` | Medium (could lock out clients) |
| 5 | Input & error hygiene | No DB internals leaked, uniform validation | Replace raw `error.message` 500 responses with codes; shared schema validation (zod or hand-rolled) for all route bodies | No route returns Postgres messages; fuzz tests on bodies | Low |
| 6 | Supabase hardening | Least privilege in DB | SECURITY DEFINER fns use `search_path = ''` + qualified names; consolidate `public.`/`private.is_project_member`; add pgTAP/RLS tests; resolve `0001_resonance.sql` vs timestamped ordering | `supabase db lint` + advisors clean on a branch DB | Medium (migration ordering) |
| 7 | Dependency currency | Stay patched without surprise majors | Patch/minor bumps; plan next@16, lucide-react@1 majors on separate PRs; Node 22 in CI | `npm audit` 0, `npm outdated` only majors with tracking issues | Medium (majors) |
| 8 | Test depth | Cover the boundaries that matter | Route-handler integration tests (auth/membership/limits), webhook replay tests, iOS ResonanceCore coverage, coverage gate | Coverage ≥80% on `src/auth`, `src/nexus` | Low |
| 9 | Observability & deploy | Truthful readiness, safe deploys | Structured logs w/o secrets; `/api/ready` contract documented; Netlify/Vercel config reviewed; smoke job manual-only | Smoke green on preview; runbook in DEPLOYMENT.md | Medium |
| 10 | Docs & AI tooling | Docs match code; AI reviewers safe | Prune drifted docs (AGENT_LOG, PUSH-INSTRUCTIONS, FLOOT-SALVAGE); update Gemini model; ARCHITECTURE refresh | Every doc referenced from README; no stale model ids | Low |
