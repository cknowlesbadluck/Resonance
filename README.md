# Resonance

**The provider-neutral integration and intelligence Nexus.**

Resonance is a plane that bridges **AI models, agents, skills, tools, connectors, plugins, applications, resources, and people** so they can discover capabilities, exchange appropriately scoped context, and cooperate under explicit policy.

> **Integration without domination.**

Resonance does not replace the systems it connects. It composes them. Connected systems retain their identity and autonomy; connection does not imply authority.

## What Resonance is

- **Nexus:** the integration layer across heterogeneous ecosystems.
- **Capability graph:** what participants can do, what resources they expose, and under what constraints.
- **Adapters:** provider-specific bridges that translate into normalized Nexus contracts.
- **Context fabric:** scoped working context plus durable knowledge.
- **Composition:** match intent to capabilities and compatible participants.
- **Policy:** explicit authority, approvals, least privilege, and auditability.
- **Execution:** direct or coordinated; a Chamber is one execution mechanism, not the product boundary.
- **Evidence:** events, artifacts, decisions, and knowledge survive temporary execution.

## MCP's place

MCP is one interoperability mechanism available to Resonance. It is not Resonance itself and it does not define the core domain model.

Resonance can bridge MCP, APIs, webhooks, SDKs, native integrations, and future protocols through adapters that expose the same normalized capability model.

## Architecture

```text
External ecosystem
  AI / agents / skills / tools / MCP / APIs / plugins / apps / resources / humans
                              ↓
                     Integration adapters
                              ↓
                    Identity + capability graph
                              ↓
                   Discovery / compatibility
                              ↓
                   Context + resource fabric
                              ↓
                    Intent / composition engine
                              ↓
                 ┌────────────┴────────────┐
                 │                         │
              Chamber                  Workflow
                 │                         │
                 └────────────┬────────────┘
                              ↓
                    Policy-controlled execution
                              ↓
                    Events / evidence / artifacts
                              ↓
                    Persistent knowledge/state
                              ↓
                         Control surfaces
```

## Existing foundation

The current codebase already provides useful foundations that are being expanded rather than discarded:

- Agenda and Chamber contracts
- Chamber participants and toolkit snapshots
- Context Plane
- capability levels and policy gate
- integration descriptors
- event ingestion
- Supabase migrations and RLS
- Next.js control plane

## Domain independence

Resonance and Quicksilver are **separate projects**. Quicksilver may later be used as one proving ground, but no Resonance core primitive is designed around it.

The test is simple:

> **Would this abstraction still make sense if Quicksilver did not exist?**

If not, it does not belong in Resonance core.

## Current Nexus proof

Nexus v1 now contains provider-neutral capability registration/discovery, policy-aware composition, scoped context primitives, normalized event/audit primitives, an MCP adapter boundary, an HTTP adapter boundary, direct execution, Chamber-capable composition, Nexus API surfaces, and a heterogeneous bridge fixture. See `docs/NEXUS_PROOF.md`.

The external bridge fixtures prove the architecture; they are not claims of production credentials or external-service connectivity.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
npm run typecheck
npm test
npm run build
```

Never commit provider secrets. GitHub is the engineering source of truth; Linear is the durable planning/decision companion.

## Governance

### Two-Key Reformation Rule

No critical reformation of Resonance may be executed without two separate explicit approvals from Christopher. Critical reformations include changes to core identity, domain semantics, fundamental architecture, source-of-truth hierarchy, irreversible migrations, major subsystem deletion/replacement, or major vendor lock-in.

Approval 1 authorizes the proposed reformation. Approval 2 authorizes execution immediately before the critical change.

Normal implementation, bug fixes, tests, documentation, and additive work do not require the two-key process unless they cross the critical threshold.

## Documentation

- `docs/ARCHITECTURE.md` — detailed architecture
- `docs/ROADMAP.md` — execution path
- `docs/NEXUS_PROOF.md` — heterogeneous bridge proof
- `docs/superpowers/specs/2026-08-15-resonance-nexus-design.md` — validated Nexus design
- `docs/superpowers/plans/2026-08-15-resonance-nexus-v1-plan.md` — implementation plan
- `src/nexus/` — Nexus domain and runtime contracts
