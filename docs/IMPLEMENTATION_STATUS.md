# Resonance Implementation Status

Observed 2026-09-30 12:00 EDT against the repository and live host.

## Verified this session

| Check | Result |
| --- | --- |
| Live host | `https://resonancenexus.netlify.app` only |
| `/api/health` | 200 |
| `/api/ready` | **503** missing `SUPABASE_SERVICE_ROLE_KEY` |
| Auth mode on that probe | required, ok |
| Persistence / GitHub adapter on live | not configured |
| Netlify production deploy | `6ab8ea114d9c5e0008fbc908` |
| SERVICE_ROLE in Netlify UI | present, production context only; value not printed |
| Main | `5ba7ca82` after #135 |

## Previously verified in code

| Check | Result |
| --- | --- |
| Invoke gate | preview/execute only when `executable === true` |
| Skill plane | HTTP resolve only; not durable |
| Headers | nosniff, frame deny, CSP without `unsafe-eval`, HSTS in production |
| Fail-closed | Production user-data routes refuse in-memory fallback |

Fail-closed behavior is in the repository. It is not proven on the live host until the current main is production-deployed, the existing production SERVICE_ROLE is loaded, migrations are applied, and `/api/ready` is 200.

## Owner actions

1. Trigger a GitHub-backed production deploy of current main on existing site `resonancenexus` (`7fc56cb3-d5f7-4bb2-8986-a733b8cfd548`). Do not invent the secret. Do not switch hosts.
2. Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql`.
3. Set scoped `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET`.
