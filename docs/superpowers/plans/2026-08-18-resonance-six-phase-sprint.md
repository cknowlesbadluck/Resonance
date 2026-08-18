# Resonance Six-Phase Rapid Development Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Advance Resonance through core, web, persistence, integration, hardening, and native iOS delivery without destabilizing the provider-neutral Nexus.

**Architecture:** Preserve the existing Nexus contracts, Supabase persistence, Next.js web surface, and Swift package. Additive changes only unless a defect is required to make a phase work. Cloudflare remains an edge/infrastructure option and is introduced only where it provides a concrete security or delivery benefit.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7, Vitest, Supabase, Swift 6, SwiftUI/iOS 17+.

**Spec:** `docs/superpowers/specs/2026-08-15-resonance-nexus-design.md`

## Global Constraints

- Resonance remains provider-neutral and domain-independent.
- One Nexus; no competing centers of control.
- MCP is an adapter, not the core abstraction.
- Chambers remain optional execution spaces.
- Quicksilver remains separate.
- Do not introduce Twilio or Vercel as Resonance dependencies.
- Do not use cockpit terminology in product UX or documentation.
- Prefer additive changes over reformation.
- Security boundaries and RLS must be preserved.
- Every phase must leave a testable increment.

---

### Task 1: Establish sprint baseline
- [ ] Record current phase status and six-phase mapping.
- [ ] Keep the existing explicit RLS security hold documented.
- [ ] Run CI/typecheck/test baseline before functional changes.

### Task 2: Complete Nexus lifecycle contracts
- [ ] Verify capability registration, discovery, composition, policy, execution, events, and persistence.
- [ ] Add lifecycle tests for registration through execution and evidence.
- [ ] Implement only missing contract behavior.
- [ ] Verify correlation IDs and bounded retry behavior.

### Task 3: Harden the web surface
- [ ] Preserve the spatial Nexus visual direction.
- [ ] Connect visible actions to real API paths.
- [ ] Add loading, empty, error, and execution states.
- [ ] Keep visual nodes truthful to capability state.
- [ ] Remove stale terminology from UX.

### Task 4: Make persistence lifecycle-complete
- [ ] Persist capability/resource/context/execution/evidence state required by the Nexus flow.
- [ ] Add idempotency keys for execution initiation.
- [ ] Add durable execution status transitions.
- [ ] Preserve RLS and document required policy SQL without auto-applying unsafe policy changes.

### Task 5: Production bridge layer
- [ ] Normalize adapter registration and invocation.
- [ ] Keep MCP behind an adapter boundary.
- [ ] Route HTTP/webhook paths through the normalized capability model.
- [ ] Add webhook signature/deduplication tests.
- [ ] Add provider-isolation tests.

### Task 6: Production hardening
- [ ] Enforce typecheck/build/test in CI.
- [ ] Verify secrets are never client-exposed.
- [ ] Add failure/retry/idempotency coverage.
- [ ] Add structured execution/error metadata where existing patterns permit.
- [ ] Run available dependency/security checks.

### Task 7: Cloudflare edge evaluation and bounded integration
- [ ] Do not migrate the application wholesale.
- [ ] Evaluate edge security, DNS, WAF, and Worker API-gateway value.
- [ ] Introduce only the smallest useful Cloudflare boundary after lifecycle tests pass.
- [ ] Keep Supabase as operational data foundation unless evidence requires otherwise.

### Task 8: Native iOS product flow
- [ ] Build native discovery, capability detail, invocation, result, and error flows over the stable Nexus API.
- [ ] Keep iOS models provider-neutral.
- [ ] Add async transport, decoding, state, and lifecycle tests.
- [ ] Verify side-store-friendly configuration and release boundaries.

### Task 9: End-to-end release gate
- [ ] Verify web discovery → invocation → evidence.
- [ ] Verify persistence across sessions.
- [ ] Verify adapter isolation.
- [ ] Verify retry/idempotency behavior.
- [ ] Verify native iOS flow against the same contracts.
- [ ] Run final CI/build/typecheck/test verification.
- [ ] Record only verified completion claims.

## Definition of Done

The same domain-neutral lifecycle works end-to-end:

`Intent → discovery → matching → scoped context → policy → execution → adapter → events/evidence → persistence → web/native presentation`

and automated verification is green.
