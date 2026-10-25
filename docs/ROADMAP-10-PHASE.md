# Resonance: 10-phase roadmap (Resonance only), 2026-10-24 21:00 ET

Scope: the provider-neutral Nexus (Next.js + Supabase, served from Netlify). Separate from `docs/PORTFOLIO-ROADMAP-10-PHASE.md`, and it supersedes the 05:00 ET `docs/RESONANCE-ROADMAP-10-PHASE.md` as the living Resonance plan. Resonance depends on documented contracts only, never on Conduit or QuicksilverV1 code.

**Observed 21:00 ET:** `https://resonancenexus.netlify.app/api/ready` returned 200 (production, authMode required, persistenceConfigured, missingRequired [], posture contract_passed). Unauthenticated `/api/nexus/executions` returned 401. `resonance.vercel.app` still serves a third-party "Detail Framework" page, so alias drift is unresolved. Main's latest runs are Gemini CLI "skipped". 0 Dependabot alerts, but Dependabot PR #189 (actions) is still open. 17 open PRs. Every merge needs a human approval. Score 6.8.

Tags: **[passed]** · **[in progress]** · **[blocked]** (owner).

| # | Phase | Goal | Concrete tasks | Exit criteria | Risks | Status |
|---|---|---|---|---|---|---|
| 1 | Human-review throughput | Unblock the queue | Owner approves #241 (static RLS/grants guard), #200, #185, #174, #172, #177, #206; merge #189 | ≤10 open PRs; none >14d unlabelled | Single reviewer is the bottleneck | [blocked] human approval |
| 2 | Fail-closed auth/deploy | Prod posture never inferred from one signal | #174 auth fails closed; #185 host-signal prod detection; #200 auth-mode allowlist | Unknown config yields 'invalid'/401 in tests and live | Lockout if Netlify CONTEXT is misread | [in progress] |
| 3 | Error hygiene | No raw DB/executor errors leave the API | #172, #177 sanitizers; #191 evidence redaction | Contract tests assert no stack/SQL text in 4xx/5xx bodies | Over-redaction hides debugging info | [in progress] |
| 4 | RLS proof | Migrations and live RLS provably match | #241 static guard in CI; #196 read-only verify-rls.sql run by owner; #207 anon Nexus graph RLS (owner applies) | verify-rls output attached to an issue; #241 green on main | Migration applied out of order (owner only) | [blocked] owner applies |
| 5 | Bounded public API | Every public input bounded, every fetch has a deadline | #206 resume guard; body-size and id validation on remaining routes; timeouts on adapter fetches | Fuzz/limit tests per public route | Breaking lenient clients | [in progress] |
| 6 | Idempotent events | Retries are safe | #209 idempotent replay for POST /api/events | Duplicate POST returns the original result, never 500 | Key collision semantics | [in progress] |
| 7 | Durable journal | Executions survive restarts | Re-scope closed #215 as a persisted journal + owner-applied migration; approve/resume idempotent | Replay test across process restart passes | Needs migration (owner) | not started |
| 8 | Fair share | Caps hold across instances | #214 shared leases (stacked, opt-in, migration not applied); #208 list indexes | Starvation test passes; p95 list latency recorded | Lease bugs stall work; keep opt-in | [blocked] owner migration |
| 9 | Alias and CI truth | Every public hostname is ours; CI on stacked PRs | Owner reclaims or removes `resonance.vercel.app`; #204 CI on any base; make main CI a real test run, not only Gemini "skipped" | Conduit alias-drift probe reports no third-party occupant; main shows a green test job | Brand/phishing risk while the alias is foreign | [blocked] owner |
| 10 | 1.0 | Stable Nexus | Versioned contractRevision, runbook, owner key-rotation doc | 30 days green, 0 alerts, ≤10 PRs, RLS proof attached | Supabase free-tier limits | not started |

## High-leverage innovations
- **Static RLS guard (#241):** catches grants and policy regressions in CI before any migration is applied, with no database access.
- **Contract posture field:** `/api/ready` already reports `posture`. Pin it in Conduit's probe (#305/#308) so a regression in posture shows up as drift within an hour.
- **Evidence privacy floor (#191):** redact credentials once at the evidence boundary, so no single route can leak them.
- **Fail-safe opt-in leases (#214):** fair share that degrades to per-instance caps when it fails, so it never stalls work.

## Top risks (blunt)
1. Six auth and error-hygiene PRs are about 7 days old and waiting only on a human approval.
2. `resonance.vercel.app` is served by a third party, which is a live impersonation risk.
3. Main CI shows only "skipped" Gemini runs at the top, so "green main" is weak evidence.
