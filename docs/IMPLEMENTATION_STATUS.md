# Resonance Implementation Status

Observed 2026-09-25 17:00 EDT against `main` `5bc73db4` and the live host.

## What was verified

| Check | Result |
| --- | --- |
| Open pull requests | 16:00 docs #110 merged. No product PRs open on this repo. |
| Live host | Netlify `https://resonancenexus.netlify.app`. Do not treat Render or `resonanceplane` as production. |
| `GET /api/health` | 200 |
| `GET /api/ready` | **503**. `authMode=required` ok. Missing only `SUPABASE_SERVICE_ROLE_KEY`. Persistence and GitHub adapter not configured. |
| Conduit | health/ready 200; version 0.8.0; persistence postgres; diagnostics green |

Fail-closed user-data behavior and ready-or-refuse UI are on `main`. They are not proven on the live host until SERVICE_ROLE is set, migrations are applied, and `/api/ready` is 200.

No secrets were invented this session.

## Working

- Provider-neutral Nexus types, composer, policy gate, executor.
- Capability plane executable flag on main.
- GitHub `github.repository.read` adapter with classified failures. CI token tests are not durable production evidence.
- Idempotency-Key required on execution create.
- Approval resume refuses to widen a plan that gained new approval requirements.
- Swift package `ResonanceCore` tests pass on the macOS CI runner. That is not an installed iPhone app.
- Web ready-or-refuse: compose/execute locked while host is not ready.

## Not done

- Live credential-backed execution stored in Supabase and readable after restart by a project member only.
- `/api/ready` 200.
- GitHub webhook delivery against the live host.
- SideStore IPA on a physical iPhone.
- A second real provider with live credentials.
- Chamber form/work/dissolve with audit intact.

## Owner actions still required

1. Set `SUPABASE_SERVICE_ROLE_KEY` on existing Netlify site `resonancenexus`. Do not switch hosts.
2. Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql`. Confirm `/api/ready` 200.
3. Set scoped `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET`.
4. Create the iOS app target from `ios/App`, archive, SideStore install, record commit + execution id.
