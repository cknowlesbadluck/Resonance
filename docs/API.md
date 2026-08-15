# Resonance API

The API is the shared boundary for the web control plane, future SwiftUI client, and automation clients.

## Authentication

Protected endpoints require a Supabase access token in:

```text
Authorization: Bearer <access-token>
```

Project membership is checked server-side for every project-scoped operation. The service-role key is server-only and must never be exposed to clients.

## Project lifecycle

- `GET /api/projects` — list projects for the authenticated user.
- `POST /api/projects` — create a project and make the caller its owner.

## Registry

- `GET /api/registry?project_id=<id>` — return integrations, agents, skills, MCP servers, and workflows for a project.
- `POST /api/registry` — create an integration, agent, skill, or MCP server. Viewer roles are denied.

## Workflows

- `GET /api/workflows?project_id=<id>` — list workflows.
- `POST /api/workflows` — create a validated workflow definition.
- `POST /api/workflows/<workflowId>/run` — create and execute a workflow run.
- `GET /api/runs/<runId>` — read a run and its event history.
- `POST /api/runs/<runId>/approve` — approve a run paused at an explicit approval step; owner/admin only.

## Workflow definition

The first engine supports three intentionally small step types:

- `noop` — deterministic execution marker used for orchestration/testing.
- `event` — records a provider-neutral workflow event with a typed payload.
- `approval` — pauses execution until an owner/admin explicitly approves the run.

A step may declare a capability such as `read`, `analyze`, `modify`, `execute`, `commit`, `create_pr`, `merge`, `deploy`, or `admin`.

The current policy is conservative: members may execute read/analyze work; privileged steps must sit behind an explicit approval boundary, and only owners/admins can approve. The engine is deliberately provider-neutral so real GitHub/Supabase/Linear/Figma/AI/MCP adapters can be attached without changing run semantics.

## Event ingestion

- `GET /api/events` — authenticated event stream for the caller's projects.
- `POST /api/events` — authenticated project event ingestion boundary.
- `POST /api/webhooks/github` — GitHub webhook receiver using `GITHUB_WEBHOOK_SECRET` and persisting verified deliveries directly with the server-side client.

## Provider adapter contract

Adapters expose `health`, `execute`, and optional `handleEvent` behavior. Capability metadata is centralized in `lib/integrations.ts`; adapters must not bypass Resonance permission checks.
