# Resonance

Resonance is a provider-neutral integration and orchestration plane for development, deployment, data, project management, and communications.

## Initial connectors

- GitHub
- Vercel
- Supabase
- Linear
- Twilio

## Architecture

Next.js control plane → API routes → Supabase operational state → provider adapters → event/workflow engine.

The initial implementation is intentionally dependency-light and uses environment variables for provider credentials. Secrets are never persisted in the repository.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables are documented in `.env.example`.
