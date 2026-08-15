# Resonance

Resonance is a provider-neutral integration and orchestration control plane for development, deployment, data, project management, design, AI agents, and MCP tools.

## Canonical stack

- **GitHub** — source control, issues, pull requests, Actions
- **Supabase** — operational database, auth, realtime, Edge Functions
- **Linear** — project and delivery tracking
- **Figma** — design source of truth
- **OpenAI** — initial AI provider behind a provider-neutral agent layer
- **Brainbase** — agent runtime/management where appropriate
- **MCP** — permissioned tool/resource interoperability
- **SwiftUI** — long-term native iOS control surface
- **Next.js** — current web control plane and API boundary

## Architecture

```text
Native iOS / Web control plane
            ↓
       Resonance API
            ↓
  Supabase state + realtime
            ↓
      Workflow engine
            ↓
     Provider adapters
            ↓
 GitHub / Supabase / Linear / Figma / AI / MCP
```

Resonance owns orchestration state, permissions, workflow runs, events, and audit history. External providers execute capabilities through explicit adapters and policy checks.

## Core domain

Projects, project members, providers, integrations, agents, skills, MCP servers, workflows, workflow runs, workflow events, and audit events are represented as first-class entities. The initial schema is in `supabase/migrations/20260815000000_resonance_core.sql`.

## Development roadmap

See `docs/ROADMAP.md` for the detailed build sequence and `docs/ARCHITECTURE.md` for the architectural contract.

## Current implementation

The repository began as a small Next.js/TypeScript integration-plane prototype. The current work evolves that foundation into the full Resonance control plane instead of replacing it with a disconnected prototype.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables are documented in `.env.example`. Never commit provider secrets.
