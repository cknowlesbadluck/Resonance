# Resonance Architecture

## Product definition

Resonance is a secure, provider-neutral AI-native integration and orchestration control plane with a native iOS control cockpit. It connects external services, skills, agents, MCP tools, workflows, and execution artifacts behind explicit capability and policy boundaries.

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
 Identity / Projects       Workflow Runtime
       |                          |
       +------------+-------------+
                    |
             Capability Policy
                    |
       +------------+-------------+
       |            |             |
   Connectors     Skills       Agents/MCP
       |            |             |
       +------------+-------------+
                    |
             Provider Adapters
                    |
     GitHub / Supabase / Linear / Figma
          OpenAI / Brainbase / MCP
                    |
              Run Event Bus
                    |
          Artifacts / Audit / State
                    |
                Supabase
```

## Core domains

- **Project** — security and configuration boundary.
- **Agent** — executable specialist identity.
- **Skill** — reusable capability assigned to agents.
- **Connector** — provider integration definition.
- **Installation** — project-scoped connector configuration and opaque credential reference.
- **Capability** — explicit operation with scopes, risk, version, and provider.
- **MCP server/tool** — external tool capability with explicit permission scope.
- **Workflow** — persisted declarative execution graph.
- **Run** — one execution of a workflow, with lifecycle state and immutable event history.
- **Approval** — explicit human authorization for privileged actions.
- **Artifact** — files, patches, reports, logs, screenshots, and build outputs produced by execution.
- **Audit event** — immutable operational history.

## Execution policy

Every action resolves through:

`actor -> project -> agent -> connector -> capability -> resource -> action -> policy -> approval -> execution`

1. Resolve project and membership.
2. Resolve workflow/agent/skill.
3. Resolve integration/MCP capabilities.
4. Evaluate policy and granted scopes.
5. Create an idempotent Run.
6. Execute through provider adapters.
7. Emit immutable events.
8. Pause at approval gates.
9. Persist artifacts/results.
10. Complete/fail/cancel and append audit history.

No adapter may bypass policy or expose secret material.

## Extension model

Third-party extensions should be manifest-driven:

- Connector manifest
- Skill manifest
- Plugin manifest
- Agent manifest
- MCP server manifest
- Workflow manifest

Each manifest declares identity, version, capabilities, required credentials, permissions, runtime entry points, health checks, and compatibility requirements.

## Provider neutrality

Agent configuration references provider abstractions rather than a single model vendor. OpenAI and Brainbase are initial integration targets, with the data model designed for additional providers.

## iOS direction

The native iOS client is the operational cockpit. It should emphasize observe/decide/approve/control rather than duplicate backend orchestration:

- Dashboard and project health
- Agent status
- Workflow control
- Live run/event stream
- Approvals
- Failures and diagnostics
- Artifacts
- Notifications
- Integrations and capability management
- App Intents for high-value control actions

The iOS app consumes the same API/domain contracts as the web control plane and remains a thin, testable presentation layer.

## Floot migration record

Floot was used as a rapid prototype/build host. The canonical source of truth is GitHub. The known Floot project and restore point are recorded in `docs/FLOOT-SALVAGE.md`.

The Floot-specific runtime must be replaced by ordinary repository code before Resonance is considered independent. Database schema/migrations belong under `supabase/`; provider adapters, runtime, policy, workflows, agents, manifests, and tests belong in the repository.

## Cost constraint

Development is intended to remain $0 out-of-pocket. Do not make paid infrastructure, paid agent builders, or Apple Developer membership prerequisites for core development. Use free/open-source/self-hosted alternatives wherever possible.
