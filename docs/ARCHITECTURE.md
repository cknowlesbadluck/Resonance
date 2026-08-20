# Resonance Architecture

## Identity

Resonance is a **provider-neutral integration and intelligence Nexus**. It bridges AI models, agents, skills, tools, connectors, plugins, applications, resources, and people.

It is not a replacement platform for those participants. It is the plane that makes their cooperation possible.

## Core invariants

1. Integration without domination.
2. Provider-specific logic stays in adapters.
3. Connection does not imply authority.
4. MCP is one bridge, not the core abstraction.
5. Chambers are optional execution spaces inside the Nexus.
6. Quicksilver is independent and must not shape Resonance core domains.
7. Context is scoped and policy-controlled.
8. Mutations are attributable and auditable.
9. Useful knowledge can survive temporary execution.

## Domain model

### Identity

A stable participant/system identity: human, model, agent, skill, tool, plugin, application, service, resource, or connector.

### Capability

A normalized operation or resource capability with permissions, risk, provenance, compatibility, availability, and adapter binding.

### Resource

An external or internal thing a capability operates on, such as a repository, document, issue, database, deployment, or dataset.

### Adapter

The provider boundary. Adapters translate provider-specific protocols into the Nexus contract. Current protocol examples are MCP and HTTP/webhook-style bridges.

### Context

Scoped information for an execution or participant. Working context is temporary; promoted knowledge can persist.

### Intent

The desired outcome plus capability requirements, actor, project, and optional context references.

### Composition

Discovery and selection of compatible capabilities, resources, adapters, permissions, and execution mode.

### Execution

A governed invocation sequence. It may be direct for simple work or use a Chamber for coordinated work.

### Evidence

Durable events, audit records, artifacts, decisions, and knowledge produced by execution.

## Runtime flow

```text
Intent
  ↓
Capability discovery
  ↓
Provider/resource matching
  ↓
Scoped context
  ↓
Policy evaluation
  ↓
Composition
  ├── direct execution
  └── Chamber / workflow execution
  ↓
Adapter invocation
  ↓
Events + audit + artifacts
  ↓
Persistent knowledge/result
```

## Chambers

A Chamber remains a useful abstraction for temporary coordinated execution. It is no longer the identity of Resonance.

A Chamber may contain agents, skills, tools, plugins, context, and permissions. When it dissolves, temporary execution state can disappear while artifacts, audit, and promoted knowledge remain.

## MCP

MCP belongs behind an adapter boundary. Core domains use `NexusCapability`, `NexusResource`, `NexusIdentity`, and normalized invocation contracts rather than MCP-specific types.

This permits Resonance to bridge MCP alongside HTTP APIs, webhooks, SDKs, native connectors, and future protocols.

## Policy

The existing policy gate remains a foundational security boundary. Nexus composition asks policy whether a capability is allowed and whether approval is required before execution. Capability exposure must never silently expand actor authority.

## Persistence

The existing Supabase schema remains the operational foundation. Nexus graph tables add identities, resources, capabilities, context, executions, and evidence without deleting the existing Agenda/Chamber/workflow model.

A dedicated Resonance Supabase project must be provisioned separately from Quicksilver before production persistence is activated.

## Control plane

The current Next.js surface is the web control plane. It exposes Nexus discovery and composition surfaces while keeping execution/domain logic in `src/nexus`.

Future surfaces may include iOS and MCP-facing control interfaces, but they are clients of the Nexus rather than the Nexus itself.

## Domain-independence rule

For every proposed core abstraction:

> Would this still make sense if Quicksilver did not exist?

If the answer is no, move the concern outside Resonance core.

## Governance

### Two-Key Reformation Rule

Critical reformation requires two explicit approvals from Christopher. Approval 1 authorizes the proposal; Approval 2 authorizes execution immediately before the change.

Critical reformations include changes to:
- core identity
- domain semantics
- fundamental architecture
- source-of-truth hierarchy
- irreversible migrations
- major subsystem deletion/replacement
- major vendor lock-in

Normal additive implementation, bug fixes, tests, documentation, and non-critical work do **not** require the two-key process.

### Explicitly pre-authorized as non-critical

The following classes of change are pre-authorized and do **not** require Two-Key approval. Agents may implement them without stalling:

1. **Idempotency design for execution initiation** — specifically the choice of required `Idempotency-Key` header + database unique index on `(project_id, idempotency_key)`. Rejecting requests that lack the header with HTTP 400 is authorized.
2. **Policy-deny logic** — refinements to the existing policy gate that make deny/approval decisions more precise without expanding actor authority or removing the gate.
3. **Approval-resume endpoint** — additive endpoint(s) that allow a previously paused (approval-required) execution to be resumed after explicit approval.

Any change that expands the set of actors who can bypass policy, removes attribution, or alters the core meaning of Identity / Capability / Intent / Evidence remains critical and still requires Two-Key.

### CI as source of truth

Observed CI results (typecheck, test, build, Swift package tests) are the authoritative signal of merge readiness. Commit messages and branch names are not. Branch protection on `main` must require the CI status checks before merge.

### Linear as backlog, GitHub as execution

Durable planning and triage decisions live in Linear (Resonance Integration Platform project). GitHub holds code, PRs, and CI evidence.
