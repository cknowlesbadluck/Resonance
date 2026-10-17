# Resonance — 10-phase roadmap to a finished Nexus with an iOS peer (updated in place 2026-10-17 03:35 EDT)

Product-only roadmap; Resonance stays domain-independent. Current audit: `docs/AUDIT-2026-10-13.md`. Engineering phase map: `docs/ROADMAP.md`.
Status: **[passed]** · **[in progress]** · **[blocked]** (owner action).

| # | Phase | Exit criteria | Status |
|---|---|---|---|
| 1 | Green, reviewed main | main CI green; actions SHA-pinned; the stack on #161 merged with one review | **[blocked]**: review throughput (owner) |
| 2 | Lean code | dead `lib/ai` (#183) and chambers/policy (#193) pruned; no unreferenced modules; one service-role client helper (#212); ESLint baseline (#211) | **[in progress]**: #193 recommended over #157 (#157 adds another unreferenced module) |
| 3 | Fail-closed auth | `RESONANCE_AUTH_MODE` fails closed (#174); host-signal prod detection (#185); route auth matrix tested | **[in progress]** |
| 4 | Bounded + private surface | rate limits (#175); bounded idempotency (#186); sanitized errors + requestId (#172/#177/#181); evidence redaction (#191); `/api/ready` names-only test (#198); resume body bounded (#206); **fair share: per-project/per-adapter in-flight caps (#213)** | **[in progress]** |
| 5 | Data security | RLS lint + read-only verify (#195/#196) run by owner; `search_path` fix (#173), anon/unscoped RLS close (#207) and list indexes (#208, CONCURRENTLY first) applied by owner | **[blocked]** (owner applies migrations) |
| 6 | Honest production | `/api/ready` 200 on Netlify with commitSha (#178); needs `SUPABASE_SERVICE_ROLE_KEY` (owner) **and** #178 (commitSha, open) | **[blocked]**: owner key + #178 review; 2026-10-16 18:04 EDT prod is **behind main** (5 contract fields absent; `npm run parity`, #202) → owner republish |
| 7 | Single capability model | client-only module retired (#156 ✓); one server schema generates TS + Swift `NexusCapability`; contract test (#184) | **[in progress]** |
| 8 | Exactly-once execution | `Idempotency-Key` required on execution creation (**already enforced**: missing/blank → 400 in `app/api/nexus/executions/route.ts`, covered by route + production-smoke tests); durable `nexus_execution_requests` claim/replay in Supabase mode; memory mode bounded by #186; events replay duplicates (#209); a replay returns the same execution id; resume stays CAS-idempotent (#206); signed webhook deliveries carry a deterministic delivery id (#210) | **[in progress]**: key + durable path exist; remaining work is a working production Supabase (owner key) and a replay-returns-same-id test against it |
| 9 | iOS peer parity | Xcode app target builds `ios/App`; iOS composes, executes **and approves/resumes** through `ResonanceCore`; Swift contract tests share web fixtures; device acceptance recorded with real evidence | **[in progress]**: library only, no app target, no resume in NexusClient |
| 10 | Finished Nexus | web + iOS complete compose → execute → approve end-to-end against production; failover (#188); runbook (#197); 7 consecutive days of Resonance-only `/api/ready` 200 (cross-product portfolio probes are monitoring only, never a gate) | **[in progress]** |

Composition, coordination and integration hygiene principles: `docs/ARCHITECTURE.md` (sections *Composition and coordination without domination* and *Integration hygiene rules*).
