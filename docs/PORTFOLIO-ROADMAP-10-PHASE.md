# Resonance 10-Phase Roadmap (refreshed 2026-10-13 18:00 EDT)

Evidence: docs/AUDIT-2026-10-13.md. Detailed table: docs/ROADMAP-audit-2026-10.md (#163).
Gates outside this repo stay open: `SUPABASE_SERVICE_ROLE_KEY` (owner), CHR-55 device acceptance.

| # | Phase | Exit criteria | Status |
|---|---|---|---|
| 1 | Stabilize CI & supply chain | main green 3×; actions SHA-pinned; Dependabot postcss alerts closed | PRs #161 #162 #164 open |
| 2 | Branch/PR/doc hygiene | ≤5 live branches; one roadmap; no timestamped refresh PRs | #168 |
| 3 | Branch protection | direct push to main rejected; `CI` required | #165 (owner setting) |
| 4 | Redeploy & contract parity | live `/api/ready` carries `contractRevision` = `EXPECTED_CONTRACT_REVISION`; `cross-plane-check --live` passes | blocked on deploy (#170 detects) |
| 5 | Auth fail-closed | production refuses `optional`/unset auth; route×mode tests | #167 |
| 6 | Error & input hygiene | no raw Postgres messages; shared body validation | planned |
| 7 | Supabase hardening | `search_path=''`, single membership helper, RLS tests on branch DB | planned (migrations added, never applied without approval) |
| 8 | Cross-plane contract | one canonical posture vocabulary shared by Resonance/Conduit/Quicksilver; cold_start retryable everywhere | #169 #170 |
| 9 | Dependency currency & tests | majors (next 16, lucide 1) in isolated PRs; coverage ≥80% on src/auth, src/nexus | planned |
| 10 | Owner gate & observability | owner sets service-role key; `/api/ready` 200 with stamp; runbook in DEPLOYMENT.md | owner action |
