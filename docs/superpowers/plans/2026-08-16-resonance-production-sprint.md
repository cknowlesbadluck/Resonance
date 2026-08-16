# Resonance Production Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Resonance from a hardened foundation into a genuinely usable, spatial iOS execution system with a verified end-to-end workflow and repeatable SideStore release path.

**Architecture:** Keep the iOS client native SwiftUI and treat Nexus as the authenticated execution control plane. Persist execution state/evidence in Supabase, expose capabilities through a provider abstraction, and keep desktop-only Lemonade/AMD outside the iOS dependency graph. The UI's Nexus Astrolabe is a visualization of the execution lifecycle rather than a decorative shell.

**Tech Stack:** SwiftUI, Swift Package Manager, Xcode/XcodeGen, Next.js/TypeScript, Supabase/Postgres, Vitest, GitHub Actions, SideStore, provider adapters for remote/local AI and MCP capabilities.

## Global Constraints

- iOS must remain independently buildable and SideStore-oriented.
- Lemonade/`lemond` must never be an iOS build/runtime dependency.
- Backend requests must remain authenticated, project-scoped, validated, idempotent, and auditable.
- Execution state and evidence must survive process restart.
- No production claim without automated CI plus physical-device release evidence.
- UI must preserve accessibility and reduced-motion behavior.
- Shared credentials must not be copied between Quicksilver and Resonance without deliberate scope approval.

---

## Phase 0 — Baseline and release instrumentation

**Exit gate:** repository has a reproducible build/test/release matrix and every subsequent phase has a measurable acceptance test.

- [ ] Record current branch/commit and CI baseline.
- [ ] Verify iOS package/test targets and XcodeGen configuration.
- [ ] Verify Nexus API contract and persistence schema.
- [ ] Add release-status document with explicit automated/device gates.
- [ ] Run backend and Swift tests.
- [ ] Commit baseline instrumentation.

## Phase 1 — First complete vertical slice

**Exit gate:** a real objective can travel from iOS to Nexus, execute one real capability, persist state/evidence, and return a result.

- [ ] Define `Intent`, `Execution`, `Capability`, `Evidence`, and `Result` contracts shared at the API boundary.
- [ ] Add failing Nexus integration tests for authenticated intent submission.
- [ ] Implement minimal intent-to-execution orchestration.
- [ ] Add durable execution status transitions.
- [ ] Add durable evidence emission.
- [ ] Add idempotent replay behavior.
- [ ] Add iOS Nexus client service and authenticated request flow.
- [ ] Bind Astrolabe execution nodes to real execution state.
- [ ] Test end-to-end against a deterministic capability.

## Phase 2 — Capability and provider system

**Exit gate:** Resonance can discover, authorize, invoke, and report capabilities through a stable adapter boundary.

- [ ] Define provider/capability protocols.
- [ ] Implement a deterministic built-in capability for acceptance testing.
- [ ] Implement remote AI provider contract.
- [ ] Implement MCP capability boundary.
- [ ] Add capability health/availability state.
- [ ] Add capability permission metadata.
- [ ] Add provider failure/error normalization.
- [ ] Surface capabilities as spatial Astrolabe objects.

## Phase 3 — Policy, approvals, and trust

**Exit gate:** dangerous or consequential actions cannot execute without the required policy/approval decision.

- [ ] Define policy decision model.
- [ ] Add approval-required execution state.
- [ ] Add approval/rejection endpoints.
- [ ] Persist approval decisions and actor identity.
- [ ] Add expiration/replay protections.
- [ ] Add iOS approval surface.
- [ ] Add evidence linking policy → decision → execution.
- [ ] Test unauthorized, rejected, expired, and approved flows.

## Phase 4 — Spatial product UI

**Exit gate:** the Astrolabe is the functional product surface, not a mock visualization.

- [ ] Replace placeholder status values with live Nexus state.
- [ ] Implement dimensional focus transitions.
- [ ] Implement execution portal/detail view.
- [ ] Implement capability orbital view.
- [ ] Implement evidence descent/timeline.
- [ ] Add meaningful depth/parallax/material hierarchy.
- [ ] Add iOS 26 Liquid Glass behind availability gates where appropriate.
- [ ] Add accessibility labels and reduced-motion equivalents.
- [ ] Test compact/large layouts and dark/light appearance.

## Phase 5 — Local AI / Lemonade integration

**Exit gate:** Lemonade is a usable optional provider without affecting iOS build/installability.

- [ ] Define local-provider adapter contract.
- [ ] Add Lemonade health/discovery protocol on supported desktop environments.
- [ ] Normalize model invocation into Nexus provider events.
- [ ] Add timeout/error/retry semantics.
- [ ] Add provider provenance to evidence.
- [ ] Verify iOS target has no Lemonade dependency.
- [ ] Document desktop-only setup.

## Phase 6 — Production reliability and security

**Exit gate:** failure, recovery, abuse, and concurrency cases are covered by automated tests.

- [ ] Add request rate/size enforcement where missing.
- [ ] Add concurrency/idempotency race tests.
- [ ] Add execution timeout/cancellation behavior.
- [ ] Add restart/recovery tests.
- [ ] Add audit/event integrity checks.
- [ ] Add secret/configuration validation.
- [ ] Verify least-privilege Supabase access.
- [ ] Run complete backend and iOS CI matrix.

## Phase 7 — SideStore release and device acceptance

**Exit gate:** signed IPA installs through SideStore on the user's iPhone and completes the vertical slice.

- [ ] Make macOS GitHub Actions archive/export deterministic.
- [ ] Configure Apple signing only through GitHub encrypted secrets.
- [ ] Produce signed IPA artifact.
- [ ] Validate IPA bundle/signature in CI.
- [ ] Install IPA through SideStore on the iPhone.
- [ ] Verify launch/authentication.
- [ ] Execute real capability from device.
- [ ] Verify durable evidence and replay behavior.
- [ ] Exercise failure/recovery scenarios on device.
- [ ] Record release evidence.

## Phase 8 — Production declaration and next-product loop

**Exit gate:** Resonance meets the original product contract and has a repeatable release path.

- [ ] Score each original product objective against evidence.
- [ ] Close or explicitly defer remaining gaps.
- [ ] Create release notes and operator runbook.
- [ ] Tag release candidate.
- [ ] Establish post-release telemetry/error review.
- [ ] Define the next feature phase from observed usage rather than speculation.

---

## Sprint protocol

Work through phases sequentially but without waiting for user approval between tasks. Each task must be independently testable. When a gate fails, fix the smallest blocking issue, rerun the relevant test, and continue. Do not label a phase complete until its exit gate has evidence.
