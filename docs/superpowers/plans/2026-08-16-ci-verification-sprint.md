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

- [ ] **Step 1: Add an approval-gating test**
- [ ] **Step 2: Add an exhausted-retry test**
- [ ] **Step 3: Add a missing-adapter test**
- [ ] **Step 4: Add a multi-step ordering test**
- [ ] **Step 5: Run `npm test -- src/nexus/executor.retry.test.ts` and require all tests to pass.**

### Task 2: Make CI a real branch verification gate

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: repository package scripts `typecheck`, `test`, and `build`.
- Produces: GitHub Actions verification on branch pushes and pull requests.

- [ ] **Step 1: Expand push coverage to all branches.**
- [ ] **Step 2: Keep `npm install`, `npm run typecheck`, `npm test`, and `npm run build` explicit and ordered.**
- [ ] **Step 3: Commit with `ci: verify all branch pushes`.**

### Task 3: Run repository verification

- [ ] Push sprint changes and confirm the workflow triggers.
- [ ] Inspect typecheck, tests, and production build results.
- [ ] Fix only defects exposed by verification.
- [ ] Re-run until the workflow is green.

### Task 4: Final quality gate

- [ ] Confirm retry result failures and thrown exceptions behave consistently.
- [ ] Confirm approval-required steps never invoke adapters.
- [ ] Confirm missing adapters fail cleanly.
- [ ] Confirm evidence is produced for final invocation failures.
- [ ] Confirm multi-step output ordering.
- [ ] Confirm typecheck, test suite, and production build all pass.
- [ ] Only after the gate is green, resume feature development.
