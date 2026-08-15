# Resonance Architecture

## Product definition

Resonance is a secure, provider-neutral AI-native **composition fabric** with a native iOS control cockpit. It connects external services, skills, agents, MCP tools, and fully-equipped plugins into temporary, goal-aligned working spaces (Chambers) behind explicit capability and policy boundaries.

It is an overpowered, governed evolution of MCP: agents are transported from their origins into shared Chambers organized by an Agenda, work against a live toolkit, and dissolve cleanly while preserving artifacts and audit.

## System shape

```text
Native iOS control cockpit / Web control plane
                    |
                    v
             Resonance API
                    |
       +------------+-------------+
       |                          |
       v                          v
 Identity / Projects       Chamber / Workflow Runtime
       |                          |
       +------------+-------------+
                    |
             Capability Policy
                    |
       +------------+-------------+
       |            |             |
   Connectors     Skills       Agents / MCP
       |            |             |
       +------------+-------------+
                    |
             Provider Adapters
                    |
              Run Event Bus
                    |
          Artifacts / Audit / State
                    |
                Supabase
```

## Core domains

- **Project** — security and configuration boundary.
- **Agenda** — structured goal + constraints + success criteria that drives a run.
- **Chamber** — temporary shared execution space bound to one Agenda. A Workflow Run may execute as a Chamber.
- **Agent** — executable specialist identity that keeps its origin. Agents are activated/transported into Chambers, never permanently merged.
- **Skill / Plugin** — fully-equipped capability unit (tools, resources, templates, session state, config).
- **Toolkit** — live, permission-filtered set of plugins available inside a Chamber. Can grow via controlled resource pulls.
- **Context Plane** — scoped shared memory for a Chamber with filtered views per participant.
- **Connector** — provider integration definition.
- **Installation** — project-scoped connector configuration and opaque credential reference.
- **Capability** — explicit operation with scopes, risk, version, and provider.
- **MCP server/tool** — external tool capability with explicit permission scope.
- **Workflow** — persisted declarative execution graph (may back a Chamber).
- **Run** — one execution of a workflow/Chamber, with lifecycle state and immutable event history.
- **Approval** — explicit human authorization for privileged actions.
- **Artifact** — files, patches, reports, logs, screenshots, and build outputs produced by execution.
- **Audit event** — immutable operational history.

## Chamber Runtime Contract

Every Chamber-backed Run must support:

1. Agenda binding
2. Agent activation/transport (identity + permissions preserved)
3. Initial toolkit seeding from Agenda + registered capabilities
4. Scoped context plane with filtered views
5. Dynamic resource/skill pulls under policy
6. Contribution protocol among participants
7. Basic dissonance/conflict detection
8. Approval pauses for privileged actions
9. Clean dissolution (agents return to origin, context extracted or discarded)
10. Immutable event stream + final artifacts + audit

## Execution policy

Every action resolves through:

`actor -> project -> agent -> connector -> capability -> resource -> action -> policy -> approval -> execution`

1. Resolve project and membership.
2. Resolve workflow/agent/skill/Agenda.
3. Resolve integration/MCP capabilities.
4. Evaluate policy and granted scopes.
5. Create an idempotent Run / open Chamber.
6. Activate/transport agents and seed toolkit.
7. Execute through provider adapters under the shared context.
8. Emit immutable events.
9. Pause at approval gates.
10. Persist artifacts/results.
11. Dissolve Chamber, return agents to origin, complete/fail/cancel and append audit history.

No adapter may bypass policy or expose secret material.

## Design invariants

- Composition over central puppet-master orchestration.
- Agents keep origin identity; they are transported, never merged.
- Agenda is the primary organizing force for Chambers.
- Toolkits are live and fully-equipped.
- Policy, capability scopes, and audit are unbypassable.
- Local-first with explicit bridges.
- Clean lifecycle (form → work → dissolve) is mandatory.
- Control plane stays separate from execution runtime.
