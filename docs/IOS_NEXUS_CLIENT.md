# Resonance iOS Nexus

## Purpose

The iOS client is a control surface for the provider-neutral Nexus. It is not a second backend and does not redefine Nexus domain semantics.

The client should let a user:

1. Discover capabilities.
2. Inspect identities, resources, context, and policy.
3. Compose an intent into an execution proposal.
4. Review/approve consequential actions.
5. Start or monitor direct or Chamber execution.
6. Inspect events, evidence, artifacts, and durable results.

## Boundary

```text
SwiftUI iOS client
       |
       | authenticated HTTPS
       v
Resonance Nexus API
       |
       +-- identity/capability graph
       +-- context/resource fabric
       +-- policy/composition
       +-- execution
       +-- events/evidence
       |
       v
Supabase persistence / external adapters
```

The iOS app must never become the source of truth for Nexus state. It owns presentation state, local UI preferences, transient navigation state, and cached read models only.

## Initial information architecture

### 1. Nexus

High-level system status, active executions, pending approvals, recent events, and capability health.

### 2. Capabilities

Search and inspect provider-neutral capabilities. Show provider, version, availability, policy requirements, and compatibility metadata when available.

### 3. Compose

Turn a user intent into a proposed composition. Show selected capabilities, required context, policy checks, execution mode, and expected side effects before execution.

### 4. Executions

Track direct and Chamber executions. Show lifecycle state, participants, progress events, failures, retries, and resulting artifacts.

### 5. Evidence

Provide an auditable timeline of decisions, approvals, events, artifacts, and provenance.

## SwiftUI rules

- Native SwiftUI first; avoid UIKit unless a concrete platform requirement demands it.
- Use modern Observation/state-management patterns appropriate to the deployment target.
- Keep domain/network code outside view bodies.
- Keep UI-owned state on `@MainActor` where justified.
- Use structured concurrency for API and event work.
- Model network responses as immutable/sendable value types where they cross concurrency boundaries.
- Do not put authorization decisions in the client. The server remains authoritative.
- Make consequential actions explicit and reviewable.
- Accessibility is part of the initial implementation, not a later polish step.

## First vertical slice

The first useful iOS slice is intentionally narrow:

```text
Authenticate
  -> load Nexus summary
  -> list capabilities
  -> inspect one capability
  -> submit intent
  -> receive execution proposal
  -> display policy/approval state
  -> execute when authorized
  -> observe execution events
  -> display evidence/result
```

This slice should exercise the existing Nexus APIs without introducing new core abstractions.

## API contract strategy

The iOS client consumes existing Nexus API contracts. If an endpoint is missing, add the smallest provider-neutral API surface necessary. Do not create iOS-specific domain semantics in the backend.

## Concurrency strategy

Use async/await throughout the client boundary. Long-running execution observation should be represented as an `AsyncSequence`/stream abstraction where the transport supports it. UI state should receive immutable snapshots rather than mutable transport objects.

## Testing strategy

- Unit-test API decoding and domain transformations.
- Unit-test intent/proposal presentation state.
- Test authorization/approval UI states independently from transport.
- Add integration tests against a deterministic Nexus fixture.
- Exercise loading, empty, partial, failure, retry, revoked authorization, and stale-event states.

## Non-goals for v1

- Reimplementing Nexus server logic on-device.
- Building a second persistence authority.
- Hard-coding a specific provider into the client.
- Replacing the existing web control plane.
- Adding connectors solely to increase plugin count.
