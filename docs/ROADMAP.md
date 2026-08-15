# Resonance Roadmap

## Phase 0 — Ground truth
- Establish repository, architecture, domain contracts, security boundaries, and provider-neutral interfaces.
- Keep `main` deployable.
- Treat GitHub as source of truth and Linear as execution tracking.

## Phase 1 — Foundation
- Next.js control plane shell.
- Supabase-backed persistence boundary.
- Authentication/session model.
- Project and membership model.
- API error and observability conventions.

## Phase 2 — Core registry
- Integration registry.
- Agent registry.
- Skill registry.
- MCP registry.
- Provider registry.
- Explicit capability metadata.

## Phase 3 — Authorization
- Project membership and roles.
- Capability-level permissions: read, analyze, modify, execute, commit, PR, merge, deploy, admin.
- Environment policies.
- Human approval gates for destructive/production actions.

## Phase 4 — Workflow engine
- Sequential steps.
- Parallel branches.
- Conditional transitions.
- Retries/timeouts/cancellation.
- Run state machine.
- Event stream and audit trail.

## Phase 5 — Development workflow
- GitHub repository discovery.
- Issue/branch/commit/PR operations.
- Agent-assisted repository analysis.
- Test/review/security stages.
- PR creation and approval boundary.

## Phase 6 — AI/runtime layer
- OpenAI provider adapter.
- Provider-neutral agent interface.
- Brainbase/runtime adapter where useful.
- MCP tool execution behind policy.

## Phase 7 — Native iOS control plane
- SwiftUI application shell.
- Projects, agents, integrations, workflows, runs, approvals, activity.
- Realtime updates.
- Secure local state.
- App Intents/Shortcuts for high-value operations.

## Phase 8 — Visual system
- Figma design system.
- Responsive web control plane.
- Native iOS design translation.
- Accessibility, loading, error, empty, and approval states.

## Phase 9 — Automation
- GitHub event triggers.
- Scheduled workflows.
- Notifications.
- External automation/MCP triggers.

## Phase 10 — Hardening
- RLS/security audit.
- Threat model.
- Dependency and secret review.
- Performance profiling.
- End-to-end workflow tests.
- Release checklist.

## First vertical slice

The first meaningful slice is:

`Project -> GitHub integration -> Agent -> Skill -> Permission check -> Workflow -> Run -> Events -> Result`

The first killer workflow is repository analysis. The next is feature implementation through plan -> code -> test -> review -> PR, with human approval where required.

## Definition of done

A feature is not complete because code exists. It must build, pass relevant tests, be exercised at runtime, verify integration behavior, pass security review appropriate to its scope, and have its diff/documentation reviewed.

## Current state

The repository is currently a small TypeScript/Next.js control-plane foundation with Supabase migration space. The roadmap deliberately evolves that foundation rather than throwing it away.
