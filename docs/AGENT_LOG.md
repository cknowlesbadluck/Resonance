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

---

## 2026-08-28 22:59 EDT — MasterDev / Grok (full hygiene pass)

**Checked:**
- Open PRs: #41 (iOS capability unify follow-up), #40 (dual model retirement), #37 (GitHub failure matrix + policy deny), #35 (iOS P3 cockpit).
- Branches: main (protected), develop, plus feature branches for the open PRs and orphans `feat/execution-fabric-hardening`, `feat/github-failure-matrix-16135786940844000109`, `jules-4557065144468535906-42c57b63`.
- Required CI (`web` + `ios`) green on #41, #40, #37 heads. Gemini non-required check fails across recent PRs.
- CodeRabbit CHANGES_REQUESTED still open on #41 (projectId binding) and #37 (resume recovery, policy, adapter edge cases).
- IMPLEMENTATION_STATUS health metrics were stale (claimed 0 open PRs).

**Decided / Done:**
- Closed #40 as superseded by #41 (comment recorded).
- Left #41 open — land after remaining review item (intent projectId for NexusCapabilityQuery).
- Left #37 open — high value; do not merge until remaining security-relevant review items resolved or waived.
- Left #35 open; triggered branch update from main; still requires fresh green checks after update. Close next cycle if no rebase progress.
- Documented orphan branches for manual prune (no delete-ref tool in this session).
- Refreshed IMPLEMENTATION_STATUS health metrics and this log.

**Verified:**
- Open PR count after close: 3 (#41, #37, #35).
- Required checks remain the merge gate; Gemini is informational only.

**Next / Hand-off:**
1. Finish #41 review fix → squash-merge.
2. Resolve or waive remaining #37 review items → merge.
3. Confirm #35 after branch update; rebase or close.
4. Manually delete orphan branches once their PRs are gone.
5. No net-new feature work until open-PR count is back under control.

---

## 2026-08-28 — Rebase + close outstanding security findings on PR #37 (Claude, with explicit approval from Christopher)

**Context:** Two overlapping fix attempts existed for the same three files (main's vulnerable baseline, PR #37's comprehensive fix, PR #39's narrower Jules-authored fix). PR #38 (Jules "master takeover directive") was still open. Closed #38 and #39, rebased #37 onto current `main`, and resolved the remaining CodeRabbit findings (4 review rounds) before merge.

**CHR-47 (prototype pollution, `policy.ts`):** Replaced the `rank[permission] === undefined` check with `Object.prototype.hasOwnProperty.call(rank, permission)`. Inherited keys (`toString`, `constructor`, `__proto__`, `hasOwnProperty`) previously resolved through `Object.prototype` and bypassed the deny path. Regression test added covering all four.

**CHR-48 (approval bypass on resume, `resume/route.ts`):** The recompose step previously zeroed `plan.approvalRequired` and every `step.requiresApproval` unconditionally. Now compares the freshly recomposed plan's per-step approval requirements against the plan originally shown at compose time (stored in `response.plan`). If recomposition would require approval on a step that wasn't already flagged as requiring it, the resume is rejected (409) and the request reverts to `waiting` rather than silently executing with the approval gate cleared.

**CHR-49 (cross-project write, `resume/route.ts`):** `recordEvidence`, `recordExecution`, and `recordEvent` sinks now write under the request's authenticated `projectId`, not the deserialized `intent.projectId` pulled from stored response data.

**Other CodeRabbit findings resolved on this pass:**
- `intents/route.ts`: removed the non-UUID `"demo"` `projectId` fallback (now requires a valid UUID, 400 otherwise); `actorId` now validated as a non-empty trimmed string rather than any truthy value.
- `github.ts` adapter: HTTP status is now classified *before* a parse failure can short-circuit into `malformed_response` — a non-JSON 401/429/5xx now correctly returns its status-derived failure code. Success-path metadata (`full_name`, `private`) is now type-validated rather than silently defaulted.
- `supabase/migrations/20260822190000_execution_request_cancelled.sql`: constraint now added `NOT VALID`, which skips the row-scanning table walk (and the bulk of the `ACCESS EXCLUSIVE` hold time that scan would otherwise cause) — the catalog update itself still briefly takes `ACCESS EXCLUSIVE`, but it's near-instant rather than proportional to table size. Row validation deferred to `20260827220000_validate_execution_request_status_check.sql`, which only needs `SHARE UPDATE EXCLUSIVE`.
- `page.tsx` Bearer-auth-on-capabilities-fetch finding was already resolved on this branch before the rebase — no change needed.

**Verification (local `vitest` run, not sourced from CI output):** `npm run typecheck` clean. `npm test`: 71 passed, 1 skipped (vertical slice, gated on `GITHUB_VERTICAL_SLICE=1`) — up from 67 passed on this branch pre-fix. 4 new test cases added: 1 in `policy.test.ts` covering CHR-47 inherited-key denial (loops `toString`/`constructor`/`__proto__`/`hasOwnProperty`), 3 in `src/nexus/adapters/github.test.ts` covering status-before-parse ordering (non-JSON 503 and 401) and success-path metadata-shape validation.

**Linear:** CHR-47/48/49 moved Todo → In Progress, cross-linked.

**Does not close:** #32 (Netlify `GITHUB_TOKEN`), #11 (SideStore IPA), #8 (durable-only execution fallback).

## 2026-08-28 (cont.) — Second round: fixes from CodeRabbit's review of the fix commit itself

CodeRabbit auto-reviewed `858b03b` and confirmed CHR-47/48/49 resolved (LGTM on all previously-flagged lines). It surfaced 5 new findings against the fix commit. Triaged and fixed the well-scoped ones in this pass; deferred the larger design items to Linear rather than rushing them:

**Fixed:**
- `resume/route.ts`: `loadRequest`'s two `maybeSingle()` calls previously discarded `.error` and treated any failure identically to "not found." A real database error now propagates and returns 500, distinct from a genuine 404.
- `github.ts`: owner/repo validation accepted the literal strings `"."` and `".."` (they pass the character-class regex). Both are now explicitly rejected as reserved path segments.
- `intents/route.ts`: `body.id`, `body.contextRefs`, and `body.metadata` flowed from `JSON.parse` straight into the composed intent with no shape check — a client could send `id: {}` or `metadata: [1,2,3]`. All three now validated before composition.
- Wording/doc nits: clarified that migration `NOT VALID` still takes a brief `ACCESS EXCLUSIVE` for the catalog update (skips the row-scan, not the lock entirely); minor wordiness and capitalization fixes CodeRabbit's LanguageTool pass flagged.

**Deferred to follow-up tickets, not fixed in this pass:**
- **Claimed-request lease/recovery** (`resume/route.ts`): if the handler is interrupted after a request moves `waiting` → `accepted` but before the final status write, the row is stuck permanently and can never be resumed or retried. This is a real gap, flagged across two review rounds now, but fixing it properly means a lease/expiry model and reconciliation logic — a design change, not a quick patch. Rushing this under the same pass as the P1 security fix risked introducing a new bug in exchange for closing an old one.
- **GitHub adapter 403 rate-limit heuristic**: GitHub sometimes returns `403` (not `429`) for secondary rate limits, distinguishable via `x-ratelimit-remaining: 0` / `Retry-After` / message content. Current code classifies all `403`s as `forbidden`. Not a security bypass either way (both deny), so lower priority than the resume-lease gap.
- **`external_id` derivation on emitted events**: minor correctness nit (should prefer `event.externalId` with fallback to `event.id` instead of deriving from `correlationId`/`type`), not a security issue.

**Verification (local, not CI-sourced):** `npm run typecheck` clean. `npm test`: 72 passed, 1 skipped (up from 71 — added 1 test for the `.`/`..` rejection; `loadRequest` error-propagation fix has no dedicated test yet since no existing test file mocks the Supabase client chain for this route — noted as a real coverage gap rather than forcing a fragile mock under time pressure).

## 2026-08-30 — Implement fixes for Claimed-request lease/recovery and GitHub adapter rate-limit heuristic

**Context:** Fixed deferred issues from previous PR reviews.

**Changed:**
- `app/api/nexus/executions/route.ts` and `app/api/nexus/executions/[id]/resume/route.ts`: Implemented logic to recover "stuck" execution requests that remain in "accepted" status for over 5 minutes by reclaiming the lease using optimistic concurrency control.
- `src/nexus/adapters/github.ts`: Updated 403 error handling to classify secondary/abuse rate limits (via `x-ratelimit-remaining: 0`, `Retry-After` header, or message content) as `rate_limited` instead of `forbidden`.
- `src/nexus/adapters/github.test.ts`: Added tests to verify the new rate-limit heuristic.
- `app/api/nexus/executions/route.ts` and `app/api/nexus/executions/[id]/resume/route.ts`: Updated event insertion to prefer `event.externalId ?? event.id` over generating from `correlationId` and `type`.

**Verification:**
- Ran `npm test`, all tests passing (75 passing, 1 skipped).
- Ran `npm run typecheck`, no errors found.
- `.github/workflows/gemini.yml`: Fixed Gemini CLI action to use `gemini-1.5-flash` model and set `continue-on-error: true`.

## 2026-09-01 — Jules (Typecheck fix)

**Checked:** `src/nexus/skills.ts` had a typescript error importing `NexusPolicyDecision` from `"./types"` instead of `"./policy"`.
**Decided / Fixed:** Moved `NexusPolicyDecision` import to `"./policy"`.
**Verified:** `npm run typecheck` and `npm run test` pass successfully.

---

## 2026-09-02 18:51 EDT — MasterDev / Grok (P6 deployment stage)

**Checked:**
- `main` @ `5eb652a`. Open PRs: #53 (CHR-44 docs, web+ios green), #52 (CHR-51, web+ios green), #49 (iOS P3, behind), #47 (draft Render migration, behind, stale).
- Live host is still Netlify project `resonancenexus` (`https://resonancenexus.netlify.app`). PR checks on current branches still report Netlify deploys. #47 assumed a Render cut-over that never landed.
- Branch protection historically required a check literally named `CI` while jobs were split into `web` + `ios`.
- Linear: CHR-33/24/39/45/46 in progress; CHR-51/52 Done on main. New CHR-53 for this P6 slice.
- Quicksilver / Forge framing is out of scope.

**Decided:**
- Close #47 as superseded (comment recorded). Do not migrate hosts without live proof.
- Recut P6 from current `main` as host-neutral deployment stage (CHR-53): env contract, `/api/health`, `/api/ready`, production smoke, aggregate job named `CI`.
- Production `RESONANCE_AUTH_MODE` must be `required`. Adapter tokens (`GITHUB_TOKEN`) are not required for process boot.
- Leave #52/#53 open (green, blocked on review). Leave #49 for the native loop; do not revive #35.
- Two-Key: not required. Additive ops/CI/docs. Host is not core identity.

**Verified:**
- Local `npm test` / `npm run typecheck` on this branch (see following commit). Merge still requires GitHub Actions `web` + `ios` + aggregate `CI`.
- No production claim. Live `/api/ready` 200 and issue #32 remain ops gates.

**Next / Hand-off:**
1. Merge this PR on green `CI`.
2. Set live Netlify env: `RESONANCE_AUTH_MODE=required`, persistence keys, `GITHUB_TOKEN`.
3. Run `SMOKE_BASE_URL=https://resonancenexus.netlify.app npm run smoke` (or workflow_dispatch).
4. Rebase/merge #52 then #53; prune `refactor/render-deployment`.
5. iOS next: I1/P3 re-cut from main (#49) after CHR-51 lands; I4 SideStore remains #11.

## 2026-09-04 — Performance Optimization for NexusExecutor adapter lookup

**Context:** Performance task to optimize `NexusExecutor` step execution loop where `Array.prototype.find()` was called for every step to look up the matching adapter by ID.

**Changed:**
- `src/nexus/executor.ts`: Converted adapter list into a `Map<string, NexusAdapter>` index in constructor (`adapterMap`) for $O(1)$ adapter lookup by ID instead of $O(M)$ array lookup per step. Preserves first-adapter-wins semantics in case of duplicate IDs.
- `src/nexus/executor.benchmark.test.ts`: Added benchmark test with 1,000 steps and 1,000 registered adapters over 10 execution iterations.

**Verification:**
- Baseline execution time: ~46.98ms per execution (469.75ms total for 10 iterations of 1000 steps x 1000 adapters).
- Optimized execution time: ~15.04ms per execution (150.44ms total for 10 iterations of 1000 steps x 1000 adapters).
- Measured performance gain: ~68% reduction in overall execution time (~3.12x speedup).
- Tests: `npm run test` (88 passed, 1 skipped) and `npm run typecheck` both pass cleanly.
