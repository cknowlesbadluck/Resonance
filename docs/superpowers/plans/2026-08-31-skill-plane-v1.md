# Resonance Skill Plane v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a provider-neutral Skill Plane that registers, validates, discovers, resolves, and composes skills against Resonance capabilities without granting authority by registration alone.

**Architecture:** Skills are normalized into declarative descriptors. A registry owns lifecycle and discovery, a resolver matches skill requirements to existing Nexus capabilities, and policy remains the authority boundary. The first slice is in-memory and additive, with no provider-specific dependency and no executable skill code.

**Tech Stack:** TypeScript, Next.js 15, Vitest 3, existing Nexus domain contracts.

**Spec:** `docs/superpowers/specs/2026-08-31-resonance-skill-plane-v1.md`

## Global Constraints

- Preserve Resonance's provider-neutral domain model.
- Registration does not imply execution authority.
- MCP remains an adapter/interoperability mechanism, not the Skill Plane domain model.
- Do not introduce Quicksilver-specific core abstractions.
- Do not add runtime dependencies for v1.
- Keep the implementation additive and testable.

---

## File map

- `docs/superpowers/specs/2026-08-31-resonance-skill-plane-v1.md` — normative design.
- `src/nexus/types.ts` — normalized skill contracts and lifecycle types.
- `src/nexus/skills.ts` — registry, validation, discovery, and requirement resolution.
- `src/nexus/skills.test.ts` — unit coverage for lifecycle, validation, discovery, and capability matching.

## Tasks

- [ ] Add normative Skill Plane specification.
- [ ] Extend Nexus types with provider-neutral skill contracts.
- [ ] Implement in-memory registry and resolver.
- [ ] Add failing tests for lifecycle and resolution behavior, then implement until green.
- [ ] Run typecheck, test suite, and production build.
- [ ] Review the diff for scope leakage and document verification results.
