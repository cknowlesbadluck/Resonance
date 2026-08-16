# Resonance Nexus Design

**Date:** 2026-08-15  
**Status:** Approved direction; implementation follows only after this design is recorded.  
**Project boundary:** Resonance is independent of Quicksilver.

## 1. Core identity

Resonance is a **provider-neutral integration and intelligence nexus**: a plane that bridges AI models, agents, skills, tools, connectors, plugins, applications, resources, and people so they can discover capabilities, exchange appropriately scoped context, and cooperate under explicit policy.

Resonance is not a replacement for the systems it connects. It composes them.

### Invariants

- Integration without domination.
- Provider neutrality inside the core domain.
- Connected systems retain their identity and autonomy.
- Connection never implies authority.
- MCP is a bridge/protocol, not the definition of Resonance.
- Chambers are execution/composition spaces inside Resonance, not the product boundary.
- Quicksilver is a separate product and must not shape Resonance-specific abstractions.
- Persistent knowledge may outlive temporary execution spaces.
- Mutating/high-impact actions are governed, auditable, and least-privilege.
- Architectural decisions must preserve domain independence.

## 2. Problem

AI and automation capabilities are fragmented across providers and ecosystems. Each system has different APIs, authentication, context models, capabilities, and execution semantics. Users currently have to manually choose agents, move context, connect tools, and coordinate results.

Resonance should provide the connective layer without forcing every participant into a single runtime or vendor.

## 3. Nexus domain model

The first-class concepts are:

### Identity

A stable representation of a participant or system: human, AI model, agent, skill, tool, connector, MCP server, plugin, application, resource, project, or service.

### Capability

A normalized description of something an identity can do or provide. Capabilities carry requirements, permissions, risk, provenance, compatibility, and availability metadata.

### Resource

A thing that can be accessed or acted upon: repository, document, database, design file, issue, deployment, dataset, message channel, etc.

### Connector / Adapter

The boundary implementation that translates between a provider-specific interface and Resonance's normalized contracts. Core domains must not contain provider-specific behavior.

### Context

Information made available to a participant or execution. Context is scoped and filtered rather than indiscriminately shared.

### Intent

The desired outcome or objective presented to Resonance.

### Composition

The process of matching an intent to required capabilities and selecting compatible participants/resources.

### Execution

The governed act of invoking capabilities and producing events, artifacts, and outcomes.

### Policy

Rules governing identity, permissions, privacy, approvals, action risk, and context exchange.

### Evidence / Knowledge

Durable records of what happened, what was learned, what was produced, and why decisions were made.

## 4. Architecture

```text
External ecosystem
  AI / agents / skills / tools / MCP / APIs / plugins / apps / resources / humans
                              |
                     Integration adapters
                              |
                    Identity + capability graph
                              |
                   Discovery / compatibility
                              |
                   Context + resource fabric
                              |
                    Intent / composition engine
                              |
                 +------------+-------------+
                 |                          |
              Chamber                    Workflow
                 |                          |
                 +------------+-------------+
                              |
                    Policy-controlled execution
                              |
                    Events / evidence / artifacts
                              |
                    Persistent knowledge/state
                              |
                         Control surfaces
```

The existing Agenda/Chamber work is preserved and repositioned as one execution mechanism within this larger plane.

## 5. MCP relationship

MCP is one interoperability mechanism available to Resonance. Resonance may consume or expose MCP capabilities, but the internal domain model must remain protocol-neutral.

The core question is "what capability exists, who provides it, what resource does it operate on, what permissions are required, and how can it be invoked?" The transport/protocol is an adapter concern.

Other bridges may include REST/GraphQL APIs, webhooks, SDKs, native integrations, connector platforms, and future protocols.

## 6. Capability graph

The capability graph is the first major Nexus-specific subsystem. It should support:

- capability discovery
- provider/identity relationships
- resource relationships
- permission requirements
- risk classification
- compatibility constraints
- provenance
- availability
- cost/latency metadata where known
- versioning

A capability should be usable without hard-coding the provider into the composition engine.

## 7. Context fabric

Context has two primary lifetimes:

- **Working context:** temporary information needed for an execution/chamber/workflow.
- **Persistent knowledge:** durable project/ecosystem information that can survive an execution.

Context exchange must support scope, visibility, provenance, and policy. Sharing context is a governed capability, not an implicit side effect of participation.

## 8. Execution model

The target loop is:

1. Receive intent.
2. Discover required capabilities.
3. Discover compatible providers/resources.
4. Compose an execution plan.
5. Establish scoped context.
6. Apply policy and approval requirements.
7. Execute through adapters/capabilities.
8. Emit durable events and evidence.
9. Produce artifacts/results.
10. Persist useful knowledge.
11. Close temporary execution spaces when appropriate.

Chambers are optional. A simple intent may execute directly; a coordinated task may form a Chamber.

## 9. Governance

Every meaningful mutation must have an attributable actor, capability, scope, policy decision, and audit trail. High-impact actions require explicit approval or a separately authorized policy budget.

Resonance must never silently gain broader authority merely because a connector exposes broader authority.

## 10. Domain-independence test

For every Resonance abstraction, ask:

> Would this primitive still make sense if Quicksilver did not exist?

If no, it belongs in an application integration or external adapter, not the Resonance core.

Quicksilver may be used as one proving ground later, alongside unrelated workloads, but Resonance is not designed around it.

## 11. Existing foundation to preserve

The current repository already contains useful foundations:

- capability levels
- integration descriptors
- Agenda
- Chamber
- Chamber participants
- Toolkit snapshots/plugins
- Context Plane
- Plugin manifests
- Chamber runtime contracts
- Policy gate
- event ingestion
- Supabase migrations and RLS

These should be expanded/reinterpreted rather than discarded without evidence.

## 12. Plugin/tool ecosystem strategy

Connected tooling is treated as an ecosystem Resonance can bridge, not as mandatory dependencies of the core.

| Tool/plugin | Intended role | Current decision |
|---|---|---|
| GitHub | Engineering source of truth and repository mutation | Primary implementation surface |
| Linear | Durable roadmap, decisions, issues, milestones, status | Planning/source-of-truth companion |
| Supabase | Operational persistence, RLS, event/context storage | Use when an actual Resonance DB is provisioned; do not reuse Quicksilver DB |
| Figma | Control-plane/product UI design and visual system | Use when visual design work becomes useful |
| Brainbase MCP | Specialist agents and agent orchestration | Use as an external participant/provider, never as Resonance core |
| Outside Agent | External agent/connector capability | Use as a participant/bridge where it provides unique capability |
| Manufact | Hosting/deployment for Resonance MCP servers | Use when a deployable MCP bridge exists |
| OpenAI Platform | Provider adapter/API setup | Use only when an actual OpenAI API integration is required |
| Descope | Identity/auth/FGA option | Consider for multi-user auth/authorization if requirements justify it |
| Convex | Alternative backend/runtime | Not selected while Supabase is the persistence direction |
| AppDeploy | Deployment/QA surface | Existing deployed control-plane artifact can be inspected, but GitHub remains source of truth |
| Netlify | Alternate web hosting | No current Resonance project; not required while the current deployment path is sufficient |
| Replit | Alternate development/build surface | Not source of truth; use only if a specific capability is uniquely useful |
| Base44 / Adalo | No-code app builders | Not appropriate for the Resonance core |
| Floot | Prior platform/build surface | Not part of the Nexus source of truth |

The list is deliberately capability-oriented: tools are used where they add a real bridge or verification capability, not merely to increase the number of platforms involved.

## 13. Initial implementation target

The first meaningful Nexus slice is deliberately small:

> **Intent -> capability discovery -> provider/resource matching -> scoped context -> policy -> execution -> event/evidence -> persistent result.**

It should work across at least two different integration mechanisms, proving that Resonance is more than an MCP wrapper or a Chamber-specific workflow engine.

## 14. Success criteria

Nexus v1 is successful when:

- a provider-neutral capability can be registered and discovered;
- multiple providers/bridge types can expose capabilities through the same normalized model;
- an intent can be mapped to capabilities without provider-specific branching in core logic;
- context can be scoped and exchanged deliberately;
- policy is evaluated before mutation;
- execution produces durable evidence/events;
- useful results can persist after a Chamber closes;
- the system remains functional without Quicksilver-specific concepts;
- MCP works as one bridge among others;
- the architecture is testable without requiring every external provider to be live.

## 15. Explicit non-goals for Nexus v1

- building every connector;
- replacing MCP;
- replacing AI providers;
- creating a universal autonomous super-agent;
- making Quicksilver a dependency;
- building a marketplace before the core works;
- forcing all executions through Chambers;
- centralizing every system's state inside Resonance.

## 16. Governance: Two-Key Reformation Rule

No critical reformation of Resonance may be executed without two separate explicit approvals from Christopher.

A critical reformation includes changes to core identity, domain semantics, fundamental architecture, source-of-truth hierarchy, irreversible migrations, major subsystem deletion/replacement, or vendor/platform lock-in.

Approval 1 authorizes the proposed reformation. Approval 2 authorizes execution immediately before the critical change. The two approvals must remain distinct; the existence of a general build directive does not silently waive the rule.

Normal implementation, bug fixes, documentation, tests, and additive work do not require the two-key process unless they cross the critical threshold.
