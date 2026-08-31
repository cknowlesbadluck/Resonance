# Resonance Skill Plane v1

## Purpose

The Skill Plane makes skills first-class, provider-neutral planning inputs to Nexus. A skill describes intent-oriented behavior and the capabilities it requires. Resonance resolves those requirements against its capability graph, evaluates policy, and produces a composition-ready result.

## Non-goals

- Executing arbitrary skill code.
- Becoming a skill marketplace.
- Replacing MCP or any external protocol.
- Owning provider credentials.
- Making Quicksilver a core dependency.
- Treating registration or discovery as authorization.

## Domain model

A `NexusSkill` has:

- stable identity: `id`, `name`, `namespace`, `version`
- descriptive metadata: description, tags, publisher, provenance
- requirements: capability requirements plus optional context/resource requirements
- behavior metadata: input/output schemas and composition hints
- trust state: source, integrity, validation status, and policy status

Requirements reuse `CapabilityRequirement` so the Skill Plane binds to the existing capability graph without creating provider-specific capability concepts.

## Lifecycle

```text
Discovered -> Validated -> Registered -> Available
                                      |
                                      v
                             Policy-approved
                                      |
                                      v
                                  Composable
```

The in-memory v1 registry exposes explicit registration and discovery. Validation rejects malformed identity/version data and duplicate skill IDs. A skill may be registered and discoverable without being executable.

## Resolution

`resolveSkill(id, capabilities, actorId)` returns:

- the skill
- each requirement with its selected capability, if any
- missing requirements
- policy decisions for selected capabilities
- whether approval is required
- a composability result

Capabilities are matched with the existing `capabilityMatches` rules and ordered using `sortCapabilities`. Policy evaluation is performed after capability matching. A policy denial makes the requirement unresolved and makes the skill non-composable.

## Discovery

Discovery supports optional text, namespace, and tag filters. Results are deterministic and sorted by namespace then name then version.

## Compatibility

The Skill Plane depends only on existing Nexus contracts. External skill formats such as `SKILL.md` may be adapted into `NexusSkill` later; Markdown is not the canonical domain model.

## Evidence

v1 exposes resolution data but does not persist events itself. Existing Nexus execution/event infrastructure can record the resulting composition in a later slice.

## Acceptance criteria

1. A valid skill can be registered and discovered.
2. Invalid skills are rejected with actionable validation errors.
3. Duplicate skill IDs are rejected.
4. Discovery filters are deterministic.
5. Skill requirements resolve against existing Nexus capabilities.
6. Unavailable/planned capabilities do not satisfy requirements.
7. Policy denial prevents composability.
8. Approval-required capabilities produce an approval requirement without being silently denied.
9. No provider-specific or Quicksilver-specific abstractions are introduced.
10. Existing typecheck, tests, and production build remain green.
