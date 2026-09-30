# Resonance Implementation Status

Observed 2026-09-30 against the repository. Live host probe is unchanged from 2026-09-28 07:00 EDT: this session does not claim a new `/api/ready` result and does not set secrets.

## Verified in code (this session)

| Check | Result |
| --- | --- |
| Invoke gate | Control surface offers preview/execute only when `executable === true` and the capability is not planned or unavailable |
| Skill plane | `GET /api/nexus/skills` and `POST /api/nexus/skills/resolve` resolve built-in skills. No public registration. Not durable |
| Headers | `next.config.ts` sends nosniff, frame deny, and a CSP without `unsafe-eval`. HSTS only when production |

## Previously verified

| Check | Result |
| --- | --- |
| Live host | `https://resonancenexus.netlify.app` only |
| `/api/ready` | **503** missing `SUPABASE_SERVICE_ROLE_KEY` (last probe 2026-09-28; not re-probed as ready) |
| Auth mode | required, ok on that probe |
| Persistence / GitHub adapter | not configured on live |
| Fail-closed | Production user-data routes refuse in-memory fallback |

Fail-closed behavior is in the repository. It is not proven on the live host until SERVICE_ROLE is set, migrations are applied, and `/api/ready` is 200.

## Owner actions

1. Set `SUPABASE_SERVICE_ROLE_KEY` on existing Netlify site `resonancenexus` (`7fc56cb3-d5f7-4bb2-8986-a733b8cfd548`).
2. Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql`.
3. Set scoped `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET`.
4. Do not switch hosts. Do not invent secrets.
