# Resonance Implementation Status

Observed 2026-09-25 against `main` `5e427d85a76f74bcdfa1a92bbdb22bb75beadfc8` and the live host. Older notes in this file treated closed issues as finished work. They were closed in a hygiene sweep, not because the acceptance checks passed.

## What was verified

| Check | Result |
| --- | --- |
| `main` CI [run 35903834598](https://github.com/cknowlesbadluck/Resonance/actions/runs/35903834598) | `web` success, `ios` success (`swift test` on macos-latest), aggregate `CI` success. `production-smoke` skipped (workflow_dispatch only). |
| Open pull requests | 0 |
| Open GitHub issues | 0 (closed as trackers, not as proof) |
| Live host | Netlify `https://resonancenexus.netlify.app` still serves this app. Do not treat Render as production. |
| `GET /api/health` | 200, `stage: deployment` |
| `GET /api/ready` | 503. Missing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESONANCE_PROJECT_ID`, `RESONANCE_AUTH_MODE`. `authMode` is `auto`. `githubAdapterConfigured` is false. `persistenceConfigured` is false. |

No Supabase migration was applied from this session. The new partial-status migration is in the repo only.

## Working

- Provider-neutral Nexus types, composer, policy gate, and executor.
- GitHub `github.repository.read` adapter with input validation and classified provider failures. CI can run it when `GITHUB_VERTICAL_SLICE=1` and `GITHUB_TOKEN` are set. That test does not prove a durable, authenticated, cross-project production record.
- Idempotency-Key required on execution create. Durable path uses `(project_id, idempotency_key)` when Supabase is configured.
- Approval resume refuses to widen a plan that gained new approval requirements.
- Swift package `ResonanceCore` tests pass on the macOS CI runner. That is not an installed iPhone app.

## Partial

- Web control surface can select a project, preview a plan, execute, approve or cancel, and show evidence. It tells the truth when the host is not ready. It cannot complete a durable signed-in journey until the host env is set.
- Chambers can run one bounded scenario in process: agenda, participants, permitted capabilities, seeded context, approval pause, resume or cancel, dissolve, retained audit. Project isolation is covered by `src/nexus/chamber-scenario.test.ts`. This is not yet wired through Supabase or the web UI.
- Catalog directory entries are `planned` / unavailable. Runtime fixtures are `provenance: "fixture"` and `availability: "unavailable"`. GitHub is available only when `GITHUB_TOKEN` is present.

## Not done

- Live credential-backed execution stored in Supabase and readable after a process restart by a project member, and not by another project or an anonymous caller.
- Production fail-closed behavior on the current Netlify host (it still lacks the required env, so `/api/ready` is 503; user-data routes now return 503 instead of process memory once this revision is deployed).
- GitHub webhook delivery against the live host (`GITHUB_WEBHOOK_SECRET` and persistence).
- A buildable signed IPA installed with SideStore on a physical iPhone. `ios/` is a Swift package plus `ios/App` sources. There is no Xcode app target in this revision, and this environment cannot compile Swift or sign an IPA.
- A second real provider beyond the GitHub read adapter. MCP remains a fixture adapter, not a live MCP session.

## Owner actions still required

1. Set the production env from `.env.example` on the existing Netlify site `resonancenexus`. Do not switch hosts as part of that.
2. Apply `supabase/migrations` to the Resonance Supabase project, including `20260925120000_execution_partial_status.sql`, and confirm `/api/ready` returns 200.
3. Set a scoped `GITHUB_TOKEN` (repository read is enough for the first slice) and `GITHUB_WEBHOOK_SECRET`.
4. On a Mac, create the iOS app target from `ios/App`, archive an IPA without paid entitlements, and install it with SideStore. Record the commit, bundle id, iOS version, and an execution id from the same intent used on the web.
