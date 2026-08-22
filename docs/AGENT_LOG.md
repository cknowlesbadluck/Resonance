# Resonance Agent Log

Append-only. Every agent session (chat or Code) must append an entry.

---

## 2026-08-19 20:24 EDT — Grok (Lead Implementation)

**Checked:** CI, unprotected main, optional Idempotency-Key.
**Decided:** CI truth; mandatory key; AGENT_LOG; Linear backlog.
**Next:** Governance PR + branch protection.

---

## 2026-08-19 21:16–22:27 EDT — Grok (Lead Implementation)

**Checked:** Ruleset blocked agent pushes; typecheck status field.
**Decided / Fixed:** Typecheck fix; CHR-34 Done.

---

## 2026-08-19 23:16 EDT — MasterDev / Grok

**Checked:** iOS missing Idempotency-Key; parallel capability models.
**Decided:** CHR-33 converge on NexusCapability; ship iOS headers.

---

## 2026-08-20 00:05 EDT — MasterDev / Grok (aggressive stabilize)

**Checked:** PR #24 merged; PR #23 would break CapabilityRequirement objects.
**Decided:** Ship durable-first + rate limit + Chamber (PR #25).

---

## 2026-08-21 07:40–08:05 EDT — MasterDev / Grok

**Checked:** PR #26 dirty after #25; iOS CI platform issue.
**Decided:** Clean PR #27 with macOS 14 + App Intents expansion; merge on green.
**Verified:** PR #27 merged.

---

## 2026-08-21 09:20 EDT — MasterDev / Grok

**Checked:**
- Stale branch cluster still present; open draft PR #29 on deleted head.
- CHR-33: main already has `capability-bridge` (catalog → NexusCapability).

**Decided / Done:**
- Deleted 36+ stale branches (event-lifecycle*, codex/production*, sprint/* leftovers, docs/roadmap duplicates, feature/capability-plane-finalization).
- Remaining branches: `main`, `develop` only.
- Closed orphaned PR #29.
- Updated IMPLEMENTATION_STATUS health metrics.
- CHR-33 status: interim bridge is the accepted convergence; NexusCapability is public contract; lib/capabilities is internal catalog.

**Verified:**
- Branch list = main + develop.
- Zero open PRs from this hygiene pass.

**Next / Hand-off:**
- Optional: further thin API routes to never export catalog types directly.
- Production bridges / SideStore IPA gate (issues #8, #11, #12).
- Keep open-PR and branch counts flat.

---

## 2026-08-22 14:05 EDT — GPT-5.6 Luna (Lead Implementation)

**Implemented:**
- Added authenticated `GitHubAdapter` behind the existing provider-neutral `NexusAdapter` boundary.
- Added normalized `github.repository.read` capability with low-risk/read policy metadata.
- Runtime registers the GitHub capability only when `GITHUB_TOKEN` is configured; demo bridges remain fallback participants.
- Capability discovery now includes runtime capabilities and resolves runtime IDs through the same Nexus contract.
- Execution composition now propagates normalized `intent.metadata.input` into execution steps and enables bounded retry defaults.
- Added GitHub adapter contract tests for authentication headers, success, and provider failure normalization.
- Added composition input propagation coverage.
- Updated implementation status to make the real-provider vertical slice the active production gate.

**Verification performed:**
- Re-read the modified repository files and commit results after each write.
- Confirmed CI workflow still defines web typecheck/test/build plus Swift package tests.
- Local execution is unavailable in this environment; no passing CI result is being claimed without GitHub Actions evidence.

**Next:**
- Run/observe CI against current main.
- Exercise the GitHub capability with real deployment credentials.
- Harden the failure/recovery matrix and close remaining CHR-33 divergence.

---

## 2026-08-22 14:18 EDT — GPT-5.6 Luna (continued execution hardening)

**Added:**
- Runtime capability discovery now persists configured runtime capabilities through `NexusPersistence.saveCapability` when a project persistence context exists.
- Capability ID resolution now combines runtime and catalog resolution while preserving the normalized `NexusCapabilityResolution` response shape.

**Verification:**
- Current main commit status was queried after the implementation pass; no individual status checks were returned yet, so CI is explicitly **unverified**, not assumed green.
- No local test/build claim is made because repository execution is unavailable in this environment.

**Next:**
- Obtain actual CI evidence.
- Exercise authenticated GitHub capability against a deployed environment.
- Attack concurrency/idempotency/recovery behavior before declaring the vertical slice complete.

---

## 2026-08-22 15:40 EDT — MasterDev / Grok

**Checked:** Open PRs #30 (iOS CHR-38, green then rebased) and #31 (execution hardening) conflicted with post-GitHub-adapter `main`. Issue #32 remaining gate is CI + failure/recovery, not more fixtures. Linear CHR-41/42/43 were still Todo.

**Decided:** Do not merge conflicted #31 onto current `main`. Re-apply the non-conflicting hardening on a fresh branch from current `main`, plus the three Linear tickets.

**Implemented on this branch:**
- Canonical nested-key idempotency hashing (CHR-31 leftover / issue #32 recovery).
- Executor persists running/waiting/completed/failed through `recordExecution`.
- Explicit executor lifecycle/event-order tests.
- Capability sort tie-breakers: latency → provider → id (CHR-42).
- HTTP and MCP adapter invocation contract tests (CHR-41).
- Web control plane: fetch errors are visible, capabilities are selectable, mutating compose sends `Idempotency-Key` (CHR-43).

**Verification:** local `npm test` + `npm run typecheck` on this branch. Merge readiness still requires GitHub Actions `web` + `ios`.

**Next:**
- Merge PR #30 if rebase CI is green.
- Close or supersede PR #31 after this branch lands.
- Do not claim issue #32 complete until credential-backed GitHub execution evidence exists.

---

## 2026-08-22 15:45 EDT — MasterDev / Grok

**Checked:** PR #33 squash-merged to `main` (`2075f34`) after required `web` + `ios` succeeded. Linear CHR-41/42/43 marked Done. Issue #32 remaining gate is credential-backed GitHub execution + durable evidence, not more fixtures. Production Netlify currently exposes only demo capabilities (`GITHUB_TOKEN` unset).

**Implemented:**
- Live GitHub vertical-slice test: compose → policy (read/low, no approval) → `GitHubAdapter` → executor lifecycle persistence → evidence file.
- Required `web` CI now sets `GITHUB_TOKEN` / `GITHUB_VERTICAL_SLICE=1` and uploads `github-vertical-slice-evidence`.
- Control plane compose sends `metadata.input.owner/repo` for `github.repository.read`.

**Verification:** local `npm test` 52 passed / 1 skipped; live slice against `cknowlesbadluck/Resonance` completed (`full_name` evidence, execution `420b2a28`). Merge still requires GitHub Actions `web` + `ios`.

**Next:**
- Merge this PR on green CI and attach the evidence artifact to issue #32.
- Do not close #32 until the CI artifact exists. Production Netlify `GITHUB_TOKEN` remains an ops gate, not a core-architecture change.
- No production claim.

---

## 2026-08-22 17:20 EDT — Grok Build (Lead Implementation)

**Inspected:** `main` @ `31a5ae7` (CI green), open PR #35 (iOS P3, `ios` job failing), issues #8/#11/#32/#36, executor, GitHub adapter, policy, resume route, control plane.

**Highest blockers found:**
1. PR #35 iOS CI: duplicate `CapturingTransport` + actor isolation in XCTest.
2. GitHub adapter had no timeout, leaked raw provider JSON, and only tested 200/404.
3. `DefaultNexusPolicy` never denied.
4. Resume interpolated untrusted ids into PostgREST `.or()`.
5. Intents/capabilities routes lacked the auth/payload bounds used by executions.
6. Web control plane used `projectId: "demo"` and fetched events without a project id.

**Changed:**
- Pushed iOS CI fix to `feature/ios-p3-execution-loop` (`cf09b9b`).
- GitHub adapter: 8s timeout, structured failure codes, normalized repository output.
- Policy deny for missing actor, unavailable/planned, and `blocked` tags.
- Resume: parameterized lookup, persist cancel, record events/executions.
- Auth + payload bounds on intents; auth on capability discovery.
- Control plane uses UUID project id on events/capabilities/executions.

**Verification:** local `npm test` / `npm run typecheck` on this branch (see following commit). No production claim. Physical SideStore IPA still external (issue #11). Netlify `GITHUB_TOKEN` still an ops gate (issue #32).
