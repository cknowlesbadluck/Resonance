# Resonance + Portfolio Audit — 2026-09-25 13:00 EDT

Observed, not hoped.

| Fact | Value |
| --- | --- |
| Resonance `main` | `cba448ab` after squash-merge of #106 |
| Prior runtime SHA | fail-closed `d9dc1e62` still the last user-data change |
| Live host | `https://resonancenexus.netlify.app` |
| `GET /api/health` | 200, `stage: deployment` at 17:01:35Z |
| `GET /api/ready` | **503** |
| `authMode` | `auto` (`authModeOk: false`) |
| `persistenceConfigured` | false |
| `githubAdapterConfigured` | false |
| missingRequired | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESONANCE_PROJECT_ID`, `RESONANCE_AUTH_MODE` |
| Netlify connector visibility | `resonanceplane` only. Production remains `resonancenexus`. Do not switch hosts. |
| Open runtime PRs | 0 |
| Extra branches | `develop`, `feature/ios-p4-compose-execute-evidence` |

## Executive read

- Maturity: alpha control plane, unreadied host.
- Binding constraint: production env unset on existing Netlify `resonancenexus`.
- Honest verdict: repeating hourly audits does not change the 503. Capability plane and fail-closed are real in git. They are not proven in production. Connector cannot set the live site secrets from this session.

## Scores vs finished vision (0–5)

| Area | Score | Gap |
| --- | ---: | --- |
| Governance and CI | 4 | production-smoke skipped |
| Auth, idempotency, policy | 4 | live authMode still auto |
| Durable execution | 2 | no live persistence |
| Capability plane | 4 | live rows + second adapter |
| GitHub adapter | 3 | no durable live evidence |
| Web UX | 3 | host not ready |
| Native iOS peer | 2 | package tests; ios-p4 orphan |
| Chamber fabric | 2 | in-process only |
| Multi-adapter | 1 | fixtures unpublished |
| Release readiness | 2 | health 200, ready 503 |

## Default path

Phase 1 only: owner sets env on `resonancenexus`. Apply migrations. Prove `/api/ready` 200. Then one durable `github.repository.read` after restart.
Reject more adapters, more Chambers, and more audit-only PRs until that holds.
