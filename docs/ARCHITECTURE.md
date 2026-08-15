# Resonance Architecture

## Product boundary

Resonance is a provider-neutral integration and orchestration control plane. The product owns projects, agents, skills, MCP registrations, integrations, workflows, runs, permissions, events, and audit history. Providers execute capabilities behind explicit adapters and policy checks.

## System shape

```text
Native iOS control surface / Web control plane
                |
                v
        Resonance API boundary
                |
       +--------+--------+
       |                 |
       v                 v
  Supabase state     Workflow engine
       |                 |
       +--------+--------+
                |
          Provider adapters
                |
   +------------+-------------+----------------+
   |            |             |                |
 GitHub      Supabase       Linear          Figma
   |            |             |                |
   +------------+-------------+----------------+
                |
       AI / Agent runtimes
       OpenAI / Brainbase
                |
              MCP
```

## Core domains

- **Project** — security and configuration boundary.
- **Agent** — executable specialist identity.
- **Skill** — reusable capability assigned to agents.
- **MCP server/tool** — external tool capability with explicit permission scope.
- **Integration** — authenticated provider connection and capability registry.
- **Workflow** — declarative sequence/parallel/conditional execution plan.
- **Run** — one execution of a workflow, with status and event history.
- **Permission** — explicit capability grant; production/destructive actions require approval.
- **Audit event** — immutable operational history.

## Provider neutrality

Agent configuration must reference a provider abstraction rather than hard-code a single model vendor. OpenAI is the initial provider, with the data model intentionally capable of representing additional providers later.

## Execution policy

1. Resolve project.
2. Resolve requested workflow.
3. Resolve agents and skills.
4. Resolve integration/MCP capabilities.
5. Evaluate permissions.
6. Create a Run.
7. Execute steps and emit events.
8. Pause at approval gates.
9. Persist artifacts/results.
10. Mark completion/failure and append audit history.

No adapter should silently bypass the permission layer.

## iOS direction

The native iOS client is the primary long-term control surface. It should consume the same API/domain contracts as the web control plane and remain a thin, testable presentation layer over shared domain semantics.

Initial feature areas:

- Dashboard
- Projects
- Agents
- Skills
- MCP
- Integrations
- Workflows
- Runs
- Approvals
- Activity
- Settings

The iOS app should use small SwiftUI feature modules, explicit dependency boundaries, async state, secure credential handling, and App Intents for high-value control actions when the native project is compiled on macOS/Xcode.
