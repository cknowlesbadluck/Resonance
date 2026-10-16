# Resonance — 10-phase roadmap to a finished Nexus with an iOS peer (updated in place 2026-10-16 14:20 EDT)

Product-only roadmap; Resonance stays domain-independent. Current audit: `docs/AUDIT-2026-10-13.md`. Engineering phase map: `docs/ROADMAP.md`.
Status: **[passed]** · **[in progress]** · **[blocked]** (owner action).

| # | Phase | Exit criteria | Status |
|---|---|---|---|
| 1 | Green, reviewed main | main CI green; actions SHA-pinned; the stack on #161 merged with one review | **[blocked]**: review throughput (owner) |
| 2 | Lean code | dead `lib/ai` (#183) and chambers/policy (#193) pruned; no unreferenced modules | **[in progress]** |
| 3 | Fail-closed auth | `RESONANCE_AUTH_MODE` fails closed (#174); host-signal prod detection (#185); route auth matrix tested | **[in progress]** |
| 4 | Bounded + private surface | rate limits (#175); bounded idempotency (#186); sanitized errors + requestId (#172/#177/#181); evidence redaction (#191); `/api/ready` names-only test (#198) | **[in progress]** |
| 5 | Data security | RLS lint + read-only verify (#195/#196) run by owner; `search_path` fix (#173) applied by owner | **[blocked]** (owner) |
| 6 | Honest production | `/api/ready` 200 on Netlify with commitSha (#178); only remaining gate was `SUPABASE_SERVICE_ROLE_KEY` | **[blocked]**: owner key |
| 7 | Single capability model | one server schema generates TS + Swift types; client-only shape retired (#158); contract test (#184) | **[in progress]** |
| 8 | Idempotent everywhere | `Idempotency-Key` required on intents/executions/resume; durable store; a replay returns the same execution id | **[in progress]**: memory store only |
| 9 | iOS peer parity | iOS composes, executes **and approves/resumes** through `ResonanceCore`; Swift contract tests share web fixtures; device acceptance recorded with real evidence | **[in progress]**: no resume/approve in NexusClient |
| 10 | Finished Nexus | web + iOS complete compose → execute → approve end-to-end against production; failover (#188); runbook (#197); 7 days of drift=false on the portfolio probe | **[in progress]** |
