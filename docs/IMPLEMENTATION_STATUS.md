# Resonance Implementation Status

Observed 2026-10-01 10:00 EDT. Live host probed this pass. No secrets set.

## Live

| Check | Result |
| --- | --- |
| Host | `https://resonancenexus.netlify.app` only |
| `/api/health` | 200 at 2026-10-01T14:01:31Z |
| `/api/ready` | **503** `missingRequired: ["SUPABASE_SERVICE_ROLE_KEY"]`, `authMode: required`, `authModeOk: true`, `persistenceConfigured: false`, `githubAdapterConfigured: false` |
| Conduit | `/health` 200, `/ready` 200, version 0.8.0, persistence postgres |

Fail-closed behavior is in the repository. It is not proven on the live host until SERVICE_ROLE is set, migrations are applied, and `/api/ready` is 200.

## Owner actions

1. Set `SUPABASE_SERVICE_ROLE_KEY` on existing Netlify site `resonancenexus` (`7fc56cb3-d5f7-4bb2-8986-a733b8cfd548`).
2. Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql`.
3. Set scoped `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET`.
4. Do not switch hosts. Do not invent secrets.
