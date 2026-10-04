Observed 2026-10-03 21:01 EDT against the repository and the public host. No secrets invented.

## Verified this session

| Check | Result |
| --- | --- |
| Public host | `https://resonancenexus.netlify.app/api/ready` returned **503** at 2026-10-04T01:01:23Z |
| Missing key | exactly `SUPABASE_SERVICE_ROLE_KEY` |
| Contract fields | body omitted `ownerActionRequired` and `contractRevision` |
| Alias host | `https://resonance-2in3qv6ni-inbetweenz.vercel.app/api/ready` returned **302** to Vercel SSO. Not proof |
| Source stamp | `EXPECTED_CONTRACT_REVISION` is `2026-10-03-owner-gate` on main |
| Auth mode | required, ok on the public probe |
| Persistence / GitHub adapter | not configured on the public host |

Fail-closed behavior is in the repository. It is not proven on the public host until SERVICE_ROLE is set, migrations are applied, Netlify serves the current contract, and `/api/ready` is 200.

## Owner actions

1. Set `SUPABASE_SERVICE_ROLE_KEY` on existing Netlify site `resonancenexus` (`7fc56cb3-d5f7-4bb2-8986-a733b8cfd548`).
2. Confirm that site deploys `main`, not a side Vercel project.
3. Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql`.
4. Set scoped `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET`.
5. Do not switch hosts. Do not invent secrets.
