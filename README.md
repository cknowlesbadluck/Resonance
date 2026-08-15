# Resonance

**Provider-neutral AI composition fabric.**

Resonance lets agents, skills, MCP tools, and fully-equipped plugins form temporary, goal-aligned working spaces (Chambers) under explicit policy, then dissolve cleanly while preserving artifacts and audit.

It is a governed, overpowered evolution of MCP.

## Core Idea

- An **Agenda** (goal + constraints + success criteria) organizes the work.
- A **Chamber** is the temporary shared execution space bound to that Agenda.
- **Agents** are transported from their origins into the Chamber (they keep identity and permissions).
- A live **Toolkit** of fully-equipped plugins is seeded and can grow via controlled pulls.
- A scoped **Context Plane** provides shared memory with filtered views.
- When the Agenda is satisfied (or the run ends), the Chamber **dissolves**. Agents return to origin. Artifacts and audit remain.

## Canonical stack

- **GitHub** — source control, issues, pull requests, Actions
- **Supabase** — operational database, auth, realtime, Edge Functions
- **Linear** — project and delivery tracking
- **Figma** — design source of truth
- **OpenAI** — initial AI provider behind a provider-neutral agent layer
- **Brainbase** — agent runtime/management where appropriate
- **MCP** — permissioned tool/resource interoperability
- **SwiftUI** — native iOS control cockpit
- **Next.js** — current web control plane and API boundary

## Architecture (short)

```
Control Plane (Web + iOS cockpit)
        ↓
   Resonance API
        ↓
 Identity + Projects + Policy
        ↓
 Chamber / Workflow Runtime
        ↓
 Capability Policy Gate
        ↓
 Connectors + Skills + Agents + MCP
        ↓
 Provider Adapters
        ↓
 Event Bus + Artifacts + Audit → Supabase
```

See `docs/ARCHITECTURE.md` for the full contract.

## Current status

Foundation + composition domain is being established:

- Domain types for Agenda, Chamber, Toolkit, Context Plane, fully-equipped plugins
- Schema migration for Chambers and Agendas
- Chamber runtime contracts
- Updated architecture and roadmap

The system evolves the original control-plane foundation rather than replacing it.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables are documented in `.env.example`. Never commit provider secrets.

## Documentation

- `docs/ARCHITECTURE.md` — system shape, domain, Chamber contract, invariants
- `docs/ROADMAP.md` — phased execution plan
- `src/domain/types.ts` — core TypeScript contracts
- `src/chambers/runtime.ts` — Chamber runtime interfaces
- `supabase/migrations/` — schema

## Design invariants

- Composition over central puppet-master orchestration
- Agents keep origin identity; they are transported, never merged
- Agenda is the primary organizing force
- Toolkits are live and fully-equipped
- Policy, capability scopes, and audit are unbypassable
- Local-first with explicit bridges
- Clean lifecycle (form → work → dissolve)
- Control plane stays separate from execution runtime
