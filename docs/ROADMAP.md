# Resonance Roadmap (Composition Fabric Edition)

## Guiding Principle

Evolve the existing foundation. Do not rewrite.  
Agenda + Chamber semantics are an upgrade to the workflow/run runtime, not a parallel system.

## Phase 0 — Ground truth (complete)
- Repository, architecture, domain contracts, security boundaries established.
- GitHub is source of truth.

## Phase 1 — Foundation + Composition Domain
- Next.js control plane shell.
- Supabase-backed persistence.
- Project and membership model.
- **Agenda + Chamber domain types and migration.**
- Core policy gate interface.
- Keep `main` deployable.

## Phase 2 — Core registries
- Integration registry.
- Agent registry (with origin support).
- Skill / fully-equipped plugin registry.
- MCP registry.
- Provider registry.
- Explicit capability metadata.

## Phase 3 — Authorization
- Project membership and roles.
- Capability-level permissions.
- Environment policies.
- Human approval gates for destructive/production actions.
- Policy evaluation required before any Chamber mutation.

## Phase 4 — Chamber Runtime (core composition)
- Agenda creation and binding.
- Chamber open / form lifecycle.
- Agent activation/transport.
- Toolkit seeding from Agenda.
- Scoped context plane + filtered views.
- Dynamic resource pulls under policy.
- Contribution protocol.
- Clean dissolution + artifact extraction.
- Immutable event stream.

## Phase 5 — Workflow + Chamber integration
- Declarative workflow graphs can back a Chamber.
- Sequential / parallel steps still supported.
- Chamber becomes the preferred execution environment for multi-agent work.

## Phase 6 — Development vertical slice
- GitHub repository discovery.
- First killer workflow: repository analysis via Chamber.
- Agent-assisted analysis → structured result → artifacts.

## Phase 7 — AI / provider layer
- OpenAI provider adapter.
- Provider-neutral agent interface.
- MCP tool execution behind policy.
- Brainbase adapter where useful.

## Phase 8 — Native iOS control cockpit
- SwiftUI application shell.
- Projects, agents, Chambers/Runs, approvals, live events, artifacts.
- Realtime updates.
- App Intents for high-value control actions.
- Thin presentation layer only.

## Phase 9 — Hardening & automation
- RLS/security audit.
- Threat model.
- End-to-end Chamber lifecycle tests.
- GitHub event triggers.
- Notifications.
- Release checklist.

## First vertical slice (priority)

```
Project → Agenda → Chamber open → Agent transport → Toolkit seed
→ Contributions + context → (optional pulls) → Dissolve → Artifacts + Audit
```

The first concrete killer use case remains repository analysis, now executed inside a Chamber.

## Definition of done

A feature is not complete because code exists. It must build, pass relevant tests, be exercised at runtime, verify integration behavior, pass security review appropriate to its scope, and have its documentation match the running system.
