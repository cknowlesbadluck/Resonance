# Resonance Nexus v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Resonance from a Chamber-centered composition foundation into a working provider-neutral Nexus that can discover capabilities, bridge heterogeneous providers, exchange scoped context, execute under policy, and retain evidence/results without depending on Quicksilver or MCP as the core.

**Architecture:** Preserve the existing Agenda/Chamber/Policy foundations while introducing a provider-neutral Nexus layer above them. Core domain contracts describe identities, capabilities, resources, adapters, intents, context, policies, executions, and evidence; provider-specific translation remains at adapter boundaries. MCP is one bridge, not the core model.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7, Supabase/Postgres with RLS, GitHub, Linear, Vitest.

## Global Constraints

- Resonance is a provider-neutral integration and intelligence nexus.
- Integration without domination.
- Quicksilver remains completely separate; no Quicksilver-specific domain primitive may enter Resonance core.
- MCP is one interoperability mechanism, not Resonance's architecture.
- Chambers are optional execution/composition spaces within Resonance.
- Provider-specific behavior belongs in adapters, not core domains.
- Connection does not imply authority.
- Mutating/high-impact actions require policy and auditability.
- Persistent knowledge may outlive temporary execution.
- GitHub is the engineering source of truth; Linear is the durable planning/decision companion.
- Do not reuse the Quicksilver Supabase project for Resonance.
- No destructive/irreversible migration without explicit approval under the two-key rule.

## Implementation status

**Nexus foundation: implemented and verified.** Provider-neutral contracts, capability registry, MCP/HTTP adapter boundaries, scoped context primitives, policy-aware composition, direct execution, Chamber bridging, normalized events/audit primitives, Nexus API surfaces, UI reframing, heterogeneous bridge fixtures, documentation, and CI verification are present on `main`.

**CI evidence:** GitHub Actions run `31917419207` passed `npm install`, `npm run typecheck`, `npm test`, and `npm run build` on 2026-08-16.

**Production persistence gate:** Dedicated Resonance Supabase provisioning remains a separate infrastructure task (`CHR-27`). Quicksilver's Supabase project is not reused. The Nexus migration is ready, but production persistence cannot honestly be claimed until a dedicated operational store is provisioned and migrated.

---

## Task 1: Establish Nexus domain contracts — COMPLETE

Implemented in `src/nexus/types.ts`, `src/nexus/identity.ts`, and `src/nexus/capabilities.ts`.

## Task 2: Build the capability registry/graph — FOUNDATION COMPLETE

Implemented in `src/nexus/registry.ts` and `supabase/migrations/20260815230000_nexus_graph.sql`. Persistent activation awaits the dedicated Resonance Supabase project.

## Task 3: Define adapter and bridge contracts — COMPLETE

Implemented provider-neutral adapter contracts plus MCP and HTTP bridge boundaries in `src/nexus/adapters/`.

## Task 4: Build the context/resource fabric — FOUNDATION COMPLETE

Implemented scoped in-memory context and persistence migration. Production durable activation awaits the dedicated Resonance operational store.

## Task 5: Implement policy-aware intent composition — COMPLETE

Implemented deterministic capability matching, provider/resource selection, policy denial, approval requirements, and direct-vs-Chamber selection.

## Task 6: Connect composition to execution and existing Chambers — COMPLETE

Implemented `NexusExecutor` plus `src/chambers/nexus.ts` bridge. Plans preserve project and actor identity.

## Task 7: Harden event/audit ingestion — FOUNDATION COMPLETE

Implemented normalized event/audit primitives and event deduplication contracts. Existing webhook routes remain the next production adapter hardening surface.

## Task 8: Add Nexus API/control-plane surface — COMPLETE FOUNDATION

Implemented Nexus capability, identity/resource, intent composition, and execution/evidence endpoints. Control-plane UI now presents Resonance as a Nexus rather than a Chamber-centered workflow product.

## Task 9: Provider bridge proof without Quicksilver — COMPLETE

`docs/NEXUS_PROOF.md` and `src/nexus/integration.test.ts` demonstrate one intent composed across HTTP-style and MCP-style bridges without Quicksilver-specific assumptions.

## Task 10: Production hardening and project synchronization — IN PROGRESS

Documentation and Linear synchronization are complete. CI is green. Remaining production hardening includes dedicated persistence provisioning, real external adapters, durable execution storage, and webhook/security end-to-end validation.

---

## Verification gates

Current verified gates:

1. TypeScript build passes.
2. Focused Nexus tests pass.
3. Heterogeneous bridge proof passes through HTTP and MCP fixtures.
4. No Resonance core type references Quicksilver.
5. MCP is isolated behind an adapter boundary.
6. Direct and Chamber planning paths exist.
7. Context is scoped and policy-aware.
8. Mutation/evidence primitives exist.
9. Persistence migration exists but requires a dedicated operational store to activate.
10. Documentation, Linear state, and GitHub source agree on the current architecture and known infrastructure gate.

## Explicitly deferred

- Dedicated Resonance Supabase provisioning until organization/cost confirmation is handled through the Supabase integration.
- Full external connector catalog.
- Automatic LLM-based capability planning.
- Marketplace/discovery economy.
- Multi-tenant enterprise authorization productization.
- iOS Nexus implementation.
- Provider-specific production adapters beyond the proof set.
- Quicksilver-specific integration. It remains an independent future proving ground.
