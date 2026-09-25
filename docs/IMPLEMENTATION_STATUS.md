# Resonance Implementation Status

Observed 2026-09-25 09:20 EDT against `main` `d9dc1e62b28a3c42096d3584272f41494cf44db9` and the live host. Older notes treated closed issues and a Completed Linear project as finished work. They were hygiene, not acceptance.

## What was verified

| Check | Result |
| --- | --- |
| `main` CI [run 36136474497](https://github.com/cknowlesbadluck/Resonance/actions/runs/36136474497) | aggregate `CI` success on `d9dc1e62`. `production-smoke` skipped. |
| Open pull requests | audit docs #104; no runtime PR |
| Open GitHub issues | 0 |
| Live host | Netlify `https://resonancenexus.netlify.app`. Do not treat Render as production. |
| `GET /api/health` | historically 200, `stage: deployment` |
| `GET /api/ready` | 503. Missing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESONANCE_PROJECT_ID`, `RESONANCE_AUTH_MODE`. |

Fail-closed user-data behavior is on `main`. It is not proven on the live host until env is set and the deploy serving `d9dc1e62` is confirmed.

No Supabase migration was applied from this session.

## Working

- Provider-neutral Nexus types, composer, policy gate, executor.
- Capability plane executable flag (#102) on main.
- GitHub `github.repository.read` adapter with classified failures. CI token tests are not durable production evidence.
- Idempotency-Key required on execution create.
- Approval resume refuses to widen a plan that gained new approval requirements.
- Swift package `ResonanceCore` tests pass on the macOS CI runner. That is not an installed iPhone app.

## Partial

- Web control surface can select a project, preview a plan, execute, approve or cancel, and show evidence when the host tells the truth about unreadiness.
- Chambers run one bounded in-process scenario. Not wired through Supabase or the web UI.
- Catalog directory entries planned/unavailable. Fixtures unpublished.

## Not done

- Live credential-backed execution stored in Supabase and readable after restart by a project member only.
- `/api/ready` 200 with `RESONANCE_AUTH_MODE=required`.
- GitHub webhook delivery against the live host.
- SideStore IPA on a physical iPhone. No Xcode app target in this revision.
- A second real provider. MCP remains a fixture.

## Owner actions still required

1. Set production env from `.env.example` on existing Netlify site `resonancenexus`. Do not switch hosts.
2. Apply `supabase/migrations` including `20260925120000_execution_partial_status.sql`. Confirm `/api/ready` 200.
3. Set scoped `GITHUB_TOKEN` and `GITHUB_WEBHOOK_SECRET`.
4. Create the iOS app target from `ios/App`, archive, SideStore install, record commit + execution id.
