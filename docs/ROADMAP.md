# Resonance Roadmap (Nexus Edition)

## Guiding Principle

**Integration without domination.** Evolve the existing foundation rather than rewriting it. Resonance is the Nexus; Chambers are one execution mechanism inside it.

## Phase 0 — Ground truth (complete)
- Repository and existing composition foundation audited.
- Nexus vision and domain-independence rule established.
- GitHub is engineering source of truth; Linear is durable planning reference.

## Phase 1 — Nexus foundation (in progress)
- Provider-neutral identity and capability contracts.
- Capability registry/graph.
- Adapter/bridge contracts.
- MCP adapter boundary.
- HTTP/API adapter boundary.
- Scoped context and resource fabric.
- Policy-aware intent composition.
- Direct execution plus Chamber bridge.
- Normalized event/audit primitives.
- Nexus API/control-plane surface.

## Phase 2 — Persistence and real bridges
- Provision a dedicated Resonance Supabase project.
- Persist Nexus identities, capabilities, resources, context, executions, and evidence.
- Implement RLS and durable audit paths.
- Replace fixtures with the first production adapters.
- Verify webhook signature and event deduplication paths.

## Phase 3 — Capability discovery and composition
- Rich capability graph.
- Provider/resource compatibility.
- Capability versioning and availability.
- Cost/latency metadata where available.
- Better context routing and provenance.
- Human approval workflows.

## Phase 4 — Execution fabric
- Mature direct execution.
- Mature Chamber execution for coordinated work.
- Workflow execution where it adds value.
- Retry/idempotency semantics.
- Durable execution history.
- Artifact and knowledge promotion.

## Phase 5 — Ecosystem bridges
- Production MCP bridges.
- GitHub/Linear/Supabase/Figma/provider adapters as justified.
- External agent participation through Brainbase/Outside Agent where useful.
- Deployment/hosting bridges where they provide a concrete capability.
- No connector expansion merely for completeness.

## Phase 6 — Multi-domain proving
- Quicksilver may be one proving ground, but remains separate.
- Add at least one unrelated workload to validate domain independence.
- Validate that the same Nexus primitives work across different domains.

## Phase 7 — Intelligence layer
- Optional model-assisted capability planning.
- Provider/model selection.
- Dynamic composition recommendations.
- Learned reliability/capability metadata.
- Human-in-the-loop for consequential decisions.

## Phase 8 — Product surfaces
- Web control plane.
- Native iOS application.
- MCP-facing control interface where useful.
- External application/API clients.

## Phase 9 — Hardening
- Security and threat-model review.
- RLS audit.
- End-to-end Nexus lifecycle tests.
- Failure/retry testing.
- Provider isolation testing.
- Performance/observability.
- Release and migration discipline.

## Nexus v1 success signal

```text
Intent
→ Capability discovery
→ Provider/resource matching
→ Scoped context
→ Policy
→ Direct or Chamber execution
→ Adapter bridge
→ Events / evidence / artifacts
→ Persistent result
```

The success signal is intentionally domain-neutral and does not require Quicksilver.

## Definition of done

A feature is not complete because code exists. It must build, pass relevant tests, be exercised at runtime where possible, verify integration behavior, respect security boundaries, and have documentation match the running system.

Critical reformation remains governed by the two-key approval rule.
