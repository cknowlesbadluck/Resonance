# Resonance — 10-Phase Production-Readiness Roadmap (refined 2026-10-14 10:00 EDT)

Purpose: Resonance is the provider-neutral Nexus control plane (Next.js 15 + Supabase). It stays independent of Conduit and other repos: no shared runtime code, no cross-repo posture classifiers. Integration with other planes happens only through documented HTTP contracts.

Principles: provider-neutral, free-tier only, no secrets in code, every phase reversible, fail-closed by default.
Owner gates (never claimed here): `SUPABASE_SERVICE_ROLE_KEY` set out of band (prod `/api/ready` is 503 until it is), CHR-55 device acceptance.
Evidence: docs/AUDIT-2026-10-13.md. Baseline: 61% line coverage, `app/api/**` was 0% (68.5% with #176 + #180). main CI red since e8df8f6 (lockfile drift).

| # | Phase | Goal | PRs / work | Exit criteria |
|---|---|---|---|---|
| 1 | Green, pinned pipeline | main always releasable | #161 lockfile (unblocker), #162 workflow hardening, #164 Dependabot; owner: branch protection (#165), Gemini model decision (#166) | 3 green main runs; direct push blocked; 0 Dependabot alerts (4 open, all postcss transitive; #161 resolves to 8.5.30 ≥ every patched version) |
| 2 | One error envelope | No DB/executor internals leak | #172 DB errors, #177 422/JSON parse errors, #181 `requestId` + `X-Request-Id` on persistence errors | No raw `error.message` in `app/api`; envelope snapshot tests |
| 3 | Fail-closed auth | Prod never runs unauthenticated | #174 (`optional` dev-only, closes #167 on merge) | Every route 401 without bearer in prod; matrix tests |
| 4 | Route contract tests | Cover the HTTP surface | #176, #180 | `app/api` ≥ 70%; schema changes fail CI |
| 5 | Abuse limits & pagination | Bounded, predictable reads | #175 in-memory rate limit; then cursor pagination on events/executions/evidence | No unbounded select; uniform `limit` caps |
| 6 | Posture correctness | `/api/ready`/posture honest under cold start | #169 cold_start + fail-closed 200; #170 contract self-check (Resonance-local only) | Cold start never reported as ready |
| 7 | Database hardening | DB enforces tenancy | #173 `search_path=''` (authored, NOT applied); RLS tests on local Postgres in CI | Non-member reads 0 rows; advisors clean on a branch DB |
| 8 | Deploy parity | Live matches main | #178 `commitSha` + parity script, #179 scheduled report-only check | Parity green within 1h of merge |
| 9 | Capability gates | Least-privilege execution | Capability manifest per adapter; executor refuses undeclared capability; audit row per denial; retire client-only capability shape (cf. #158, needs rebase) | Undeclared capability ⇒ 403 + audit |
| 10 | Owner gate & operations | Honest 200 from `/api/ready` | Owner sets service-role key; runbook, structured redacted logs, SLOs; decide `lib/ai/` dead code | `/api/ready` 200 stamped; runbook dry-run; CHR-55 tracked separately |

## Merge order
1. #161 (unblocks main CI) → 2. #162, #164 (independent, based on main) → 3. stack: #172 → #176 → #177 → #178 → #179 / #180; #181 on #177 (each auto-retargets as parent merges) → 4. siblings on #161: #174, #175, #169, #170 → 5. #173 (merge file only; applying the migration is a separate owner step) → 6. #171 (this doc) last.

Held / owner decision: #154 and #157 (lattice/chamber experiments, conflicting with main, labelled do-not-merge), #158 (conflicting; needs rebase if still wanted).

Status 2026-10-14 10:00 EDT: no merges/commits/issues since 06:00; all audit PRs green and mergeable (incl. #181); Dependabot #1–#4 (postcss) covered by #161, no extra bump PR; prod `/api/ready` not re-verified (production URL not discoverable from the repo; preview is Vercel-auth protected) — assume 503 until the service-role key is set.
