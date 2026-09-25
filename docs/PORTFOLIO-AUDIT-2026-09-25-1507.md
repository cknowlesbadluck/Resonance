# Resonance / portfolio audit — 2026-09-25 15:07 EDT

## Live
- Host remains `https://resonancenexus.netlify.app`
- `/api/health` 200
- `/api/ready` 503 missing `SUPABASE_SERVICE_ROLE_KEY` only
- `authMode=required` and `authModeOk=true`
- `persistenceConfigured=false`, `githubAdapterConfigured=false`

## Shipped on main this hour
- #108 squash-merged as `38939aa0`: ready-or-refuse locks Preview / Execute / Resume while ready is false; banner lists missing env.
- Fail-closed production routes already on main (`d9dc1e62`).
- Capability plane + Linear adapter already on main (`6a362e28` / `bb252a63`).

## Not shipped
- Live ready 200
- Durable GitHub evidence after process restart
- Physical iPhone compose→approve→execute→evidence
- Chamber form/work/dissolve

## Constraints
- Do not switch hosts to resonanceplane.
- Do not invent SERVICE_ROLE or GitHub tokens.
- Connected Netlify connector historically lists resonanceplane; production site is still resonancenexus.
