# Resonance: 10-phase roadmap (Resonance only)

Scope: the provider-neutral Nexus (Next.js + Supabase on Netlify), with Chambers, adapters and policy. This is separate from `docs/PORTFOLIO-ROADMAP-10-PHASE.md`. Resonance does not depend on Conduit or QuicksilverV1 code, only on documented contracts.
Tags: **[passed]** · **[in progress]** · **[blocked]** (needs owner). Last observed 2026-10-24 05:02 ET: `/api/ready` 200 (production, authMode required, persistenceConfigured, missingRequired []). Unauthenticated `/api/nexus/executions` returns 401. Main CI green. 216 tests pass, tsc clean. **4 open Dependabot alerts** (cleared by #233). 45 open PRs, mostly BEHIND.
Every merge needs 1 human approving review. Bot approval is not enough, and admin merges are not allowed.

| # | Phase | Concrete tasks | Exit criteria | Status |
|---|---|---|---|---|
| 1 | Close Dependabot alerts | Human review and merge #233 (next 15.5.28 + vitest). Then #189 (actions). | 0 open Dependabot alerts | [blocked] (human review) |
| 2 | PR entropy down | Rebase or close the BEHIND backlog (38 PRs aged 7–30d). Land the APPROVED small PRs first (#200, #193, #212). Close what is superseded. | ≤12 open PRs. Stacks ≤2 deep. | [in progress] |
| 3 | Lint + CI on stacks | ESLint baseline (#211). CI on PRs into any base (#204). | `npm run lint` is in CI and clean | [in progress] |
| 4 | Fail-closed auth/deploy | Production detection from host signals (#185). Allowlisted auth-mode echo (#200). Bound the resume body (#206). Bound discovery params (#205). | Every route has an unauth-401 test and a bounded-input test | [in progress] |
| 5 | RLS + grants proven | Static RLS/grants guard (#241). Per-table policy intent (#195). Read-only verify-rls.sql (#196) run by the owner against live. Close anon graph access (#207, migration applied by owner). | Live RLS matches the migrations. There are no anon table grants. | [blocked] (owner applies #207, runs #196) |
| 6 | Bounded runtime | Idempotency store cap (#186). Duplicate-event replay (#209). Outbound fetch timeouts (#216). Fair-share slots (#213). | Burst test gives no 500s and no unbounded maps | [in progress] |
| 7 | Honest posture | `/api/ready` commitSha. Report-only deploy-parity check (#202). Cross-plane contract test (#184). | Deploy SHA equals main HEAD, checked on a schedule | [in progress] |
| 8 | Durable execution | Journal contract (#215). Shared leases (#214, migration applied by owner). Composite indexes (#208, owner). | Approve/resume is idempotent across instances | [blocked] (owner migrations) |
| 9 | Provider-neutral adapters | Adapter contract plus failover (#188). Signed webhook adapter (#210). Policy dry-run explain (#217). Evidence privacy floor (#191). | Two adapters are interchangeable behind one policy, with no vendor lock-in | [in progress] |
| 10 | Lean, free, operable | Prune `lib/ai` (#183) and unused chambers/policy (#193). Runbook. Document the free-tier budget. Capability-plane convergence (#237). | No unreferenced modules. Runbook rehearsed. Zero paid services. | [in progress] |

## Challenged requirements
- "Provider-neutral" is still undefined. Write down the minimum adapter contract (inputs, errors, idempotency) before adding a third adapter.
- Chambers vs policy: both claim approval semantics. Pick one owner of `approval_required`.
- Migrations are "owner applies" with no ledger, so live drift is invisible until #196 runs.

## Risks
- Migration-vs-live RLS drift is unverified. The anon graph access fix (#207) is not applied.
- 45 open PRs → constant rebase cost; stacked PRs (#213→#214) are DIRTY.
- Next.js advisories stay open until #233 has human review.

## Innovation ideas
1. **Policy dry-run explain** endpoint (#217): callers see allow / approval_required / deny before they execute anything.
2. **RLS proof bundle**: the static guard plus a read-only live verify script produce one artifact per release.
3. **Evidence privacy floor**: redact credentials before evidence is persisted, which makes the system privacy-first by construction.
