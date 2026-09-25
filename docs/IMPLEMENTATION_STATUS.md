# Resonance Implementation Status

Observed 2026-09-25 12:07 EDT against `main` after #105 (`77dc9395`, prior `c08cdc79` / fail-closed `d9dc1e62`) and the live host.

## What was verified

| Check | Result |
| --- | --- |
| Open pull requests | docs #105 squash-merged; this 12:07 docs branch | 
| Open GitHub issues | 0 |
| Live host | Netlify `https://resonancenexus.netlify.app`. Do not treat Render or `resonanceplane` as production. |
| `GET /api/ready` | **503**. Missing persistence/auth env. Confirmed this hour. |
| Conduit | health/ready/diagnostics green; version 0.8.0; persistence postgres |

Fail-closed user-data behavior is on `main`. It is not proven on the live host until env is set and the deploy serving that SHA is confirmed.

No Supabase migration was applied from this session. No secrets were invented.

## Working

- Provider-neutral Nexus types, composer, policy gate, executor.
- Capability plane executable flag (#102) on main.
- GitHub `github.repository.read` adapter with classified failures. CI token tests are not durable production evidence.
- Idempotency-Key required on execution create.
- Approval resume refuses to widen a plan that gained new approval requirements.
- Swift package `ResonanceCore` tests pass on the macOS CI runner. That is not an installed iPhone app.

## Not done

- Live credential-backed execution stored in Supabase and readable after restart by a project member only.
- `/api/ready` 200 with `RESONANCE_AUTH_MODE=required`.
- GitHub webhook delivery against the live host.
- SideStore IPA on a physical iPhone.
- A second real provider. MCP remains a fixture.

## Owner actions still required

1. Set production env from `.env.example` on existing Netlify site `resonancenexus`. Do not switch hosts.
2. Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql`. Confirm `/api/ready` 200.
3. Set scoped `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET`.
4. Create the iOS app target from `ios/App`, archive, SideStore install, record commit + execution id.
