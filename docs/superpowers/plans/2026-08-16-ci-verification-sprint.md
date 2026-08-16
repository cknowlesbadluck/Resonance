# CI Verification Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a repeatable green verification gate for Nexus execution semantics and the production Next.js build.

**Architecture:** Preserve the existing Nexus adapter/executor boundary. Strengthen behavior through focused Vitest coverage and make GitHub Actions run typecheck, tests, and production build on every branch push and pull request to main.

**Tech Stack:** TypeScript 5.7, Vitest 3.2, Next.js 15.5, GitHub Actions, Node 20.

## Global Constraints

- Do not introduce a new Nexus error abstraction during this sprint.
- Keep retry semantics inside `NexusExecutor`.
- Preserve the existing `NexusAdapter` and `NexusExecution` contracts.
- CI must fail on typecheck, test, or production-build failure.
- Use zero-cost repository-native tooling only.

---

### Task 1: Complete executor behavior coverage

**Files:**
- Modify: `src/nexus/executor.retry.test.ts`

**Interfaces:**
- Consumes: `NexusExecutor.execute(plan)` and `NexusAdapter.invoke()`.
- Produces: regression coverage for approval gating, exhausted retries, missing adapters, and ordered multi-step execution.

- [x] Add approval-gating coverage.
- [x] Add exhausted-retry coverage.
- [x] Add missing-adapter coverage.
- [x] Add multi-step ordering coverage.
- [ ] Confirm focused tests pass in CI.

### Task 2: Make CI a real branch verification gate

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: repository package scripts `typecheck`, `test`, and `build`.
- Produces: GitHub Actions verification on branch pushes and pull requests.

- [x] Expand push coverage to all branches.
- [x] Keep `npm install`, `npm run typecheck`, `npm test`, and `npm run build` explicit and ordered.
- [x] Remove the `setup-node` npm cache because the repository currently has no lockfile; the first CI run failed at setup before reaching project verification.

### Task 3: Run repository verification

- [x] Trigger CI from the sprint branch.
- [x] Inspect the initial workflow run and identify the lockfile-dependent cache failure.
- [x] Fix the workflow without adding unnecessary dependencies.
- [ ] Confirm the corrected workflow reaches typecheck, tests, and production build.
- [ ] Fix only defects exposed by verification.
- [ ] Re-run until the workflow is green.

### Task 4: Final quality gate

- [x] Confirm retry result failures and thrown exceptions have explicit coverage.
- [x] Confirm approval-required steps never invoke adapters.
- [x] Confirm missing adapters fail cleanly.
- [x] Confirm evidence is produced for final invocation failures.
- [x] Confirm multi-step output ordering is asserted.
- [ ] Confirm typecheck, test suite, and production build all pass.
- [ ] Only after the gate is green, resume feature development.
