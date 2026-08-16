# Resonance Native iOS UI Direction

## Product thesis

Resonance should feel like an intelligent action environment, not a dashboard of integrations. The primary interaction is expressing an outcome; the system then exposes the plan, permissions, execution, and evidence needed to make that outcome trustworthy.

## First release information architecture

1. **Home** — active work, recent results, pending approvals, and a single prominent intent entry point.
2. **Intent** — compose an outcome in natural language; show inferred capabilities and context before execution.
3. **Plan** — explain what Resonance intends to do, which providers/resources will participate, risk, and whether approval is required.
4. **Live execution** — stream meaningful events and progress without overwhelming the user.
5. **Result** — present the outcome, artifacts, provenance, and next actions.
6. **Capabilities** — searchable inventory of what the connected Nexus can currently do.
7. **History** — durable execution/evidence timeline.

## Interaction principles

- Outcome-first, capability-second.
- Progressive disclosure: simple by default, deep when requested.
- Every consequential action has an inspectable plan and policy state.
- Evidence is a first-class product surface, not a debug log.
- Errors should explain what failed, what was preserved, and what can be retried.
- Avoid integration-logo dashboards as the primary navigation model.
- Prefer native SwiftUI and system interaction patterns.
- Accessibility, Dynamic Type, reduced motion, and compact-width layouts are first-class requirements.

## Visual direction

The eventual visual system should communicate precision, intelligence, and trust without becoming a sci-fi control panel. Use restrained hierarchy, strong typography, clear status semantics, purposeful motion, and rich evidence cards. Visual novelty should come from the interaction model and information choreography rather than decorative effects.

## Architecture constraint

The UI consumes provider-neutral Nexus models. It must not encode provider-specific business logic or become the source of truth for capabilities, policies, or execution semantics.

## SideStore constraint

The product must remain viable for sideloaded distribution. Keep the core client independent of App Store-only services and minimize unnecessary runtime dependencies.

## Evolution path

The first vertical slice should establish the visual language around Intent → Plan → Execute → Evidence → Result. Once that flow is proven, Figma/design exploration can refine the system without forcing a rewrite of the domain or networking layers.
