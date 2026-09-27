# Resonance Implementation Status

Observed 2026-09-27 06:00 EDT against live `resonancenexus` and Conduit 0.8.0.

## Verified

| Check | Result |
| --- | --- |
| Live host | `https://resonancenexus.netlify.app` only |
| `/api/health` | 200 |
| `/api/ready` | **503** missing `SUPABASE_SERVICE_ROLE_KEY` |
| Auth mode | required, ok |
| Persistence / GitHub adapter | not configured on live |
| Conduit | health/ready 200, 0.8.0, postgres; MCP diagnostics green; HTTP `/diagnostics` 404 because production `src/index.ts` never mounted the #140 route; fix PR #143 |
| Hygiene | 19:00 docs #123 on main; 06:00 in-place refresh; QS M1-T6 #174 and M1-T7 #175 on main |

Fail-closed behavior is on main. It is not proven on the live host until SERVICE_ROLE is set, migrations are applied, and `/api/ready` is 200.

## Owner actions

1. Set `SUPABASE_SERVICE_ROLE_KEY` on existing Netlify site `resonancenexus` (`7fc56cb3-d5f7-4bb2-8986-a733b8cfd548`).
2. Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql`.
3. Set scoped `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET`.
4. Do not switch hosts. Do not invent secrets.
