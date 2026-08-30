# Render Deployment

Resonance's web-facing administrative/control surface is deployed as a Next.js Node web service on Render.

## Service

- Service: `resonance-admin`
- Runtime: Node
- Plan: Free during the current development phase
- Region: Ohio
- Build: `npm ci && npm run build`
- Start: `npm start`
- Auto-deploy: enabled from the configured deployment branch

## Required environment variables

Configure secrets in Render; never commit them to the repository:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESONANCE_PROJECT_ID`
- `GITHUB_TOKEN`
- `GITHUB_WEBHOOK_SECRET`
- `LINEAR_API_KEY`

## Architectural boundary

Render is deployment/runtime infrastructure for the web control surface. It is not part of Resonance's core domain model. The native iOS client, Nexus contracts, Supabase persistence, and provider adapters remain independently defined.

## Verification gate

A Render deployment is not considered production-ready until the build succeeds, CI remains green, required runtime secrets are configured, and authenticated execution produces durable evidence through the Resonance API.
