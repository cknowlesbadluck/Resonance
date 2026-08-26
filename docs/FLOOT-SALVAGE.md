# Resonance — Floot Salvage Record

Date: 2026-08-15

## Purpose

This document preserves the state and architectural decisions reached in the Floot-hosted Resonance project before removing Floot from the critical development path.

## Floot project

- Project ID: `fac9d082-4d62-4591-a146-4347dde43479`
- Project name: `Resonance`
- Production URL: `https://resonance-integration-plane.floot.app`
- Restore checkpoint: `Agent runtime and workflow execution`
- Checkpoint ID: `1eae3da0-89bc-4e43-a4f2-4d0c9d5c7179`

## Implemented in Floot

- Persistent integration/capability registry
- Connector, skill, plugin, agent, and MCP catalog model
- Integration installations with credential references and granted scopes
- Provider adapter boundary
- Capability risk/scoping model
- Approval-aware execution model
- Persistent workflow definitions and workflow steps
- Workflow run persistence and idempotency
- Run event persistence
- Agent registry and agent runs
- Agent/workflow/run authenticated API surfaces
- Project membership enforcement on runtime surfaces
- Agent management UI
- Workflow Studio/runtime UI
- Run/event console foundation
- iOS-oriented capability seed set
- Production deployment

## Seed capabilities

- GitHub repository read
- GitHub pull-request write
- Supabase database read
- Linear issue write
- Figma file read
- MCP tool execution
- SwiftUI build

## Target architecture

```text
Resonance Core
  Identity / Projects / Context / Policy
        |
  Capability Registry
        |
  Connectors / Skills / Agents / MCP
        |
  Provider Adapter Layer
        |
  Workflow Runtime
        |
  Runs / Events / Approvals / Artifacts
        |
  Persistence / Audit / Observability
        |
  Web Control Plane + Native iOS Control Nexus
```

## Important design decisions

1. Credentials must be represented by opaque references. Secret material must never be returned by catalog APIs.
2. Capabilities are explicit and scoped; privileged actions require approval.
3. Integrations are provider-neutral through adapter interfaces.
4. Agents are first-class runtime objects with skills, connectors, capabilities, policy, and lifecycle state.
5. Workflows are persisted definitions rather than UI-only state.
6. Runs are idempotent and emit immutable events.
7. Project membership is the boundary for runtime data access.
8. The iOS application is a control Nexus: observe, approve, control, inspect — not a duplicate of the backend.

## Migration strategy

Floot is not a source-of-truth dependency. The canonical source of truth is GitHub.

The next migration pass should:

1. Reconstruct/verify all Floot-generated source against the existing GitHub repository.
2. Move database schema/migrations into `supabase/`.
3. Move provider adapters, runtime, policy, workflow, agent, and connector manifests into normal repository modules.
4. Replace Floot-specific helpers/services with standard Next.js/server-side modules.
5. Preserve API contracts where practical.
6. Recreate CI verification in GitHub Actions.
7. Add provider integration tests with mocked external APIs.
8. Add a native SwiftUI client in a separate iOS target/package.
9. Treat Floot only as a historical deployment/checkpoint, not as an architectural dependency.

## Do not lose

The following are architectural requirements, not optional features:

- capability graph
- policy engine
- approval boundaries
- MCP lifecycle
- agent runtime
- workflow graph execution
- event stream
- artifact model
- connector installation lifecycle
- audit trail
- native iOS control surface
- extension/manifest SDK

## Cost constraint

The project is intended to remain a $0-out-of-pocket development path. Do not introduce paid infrastructure as a prerequisite. Free/open-source/self-hosted alternatives are preferred.
