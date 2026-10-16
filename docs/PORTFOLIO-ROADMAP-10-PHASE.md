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
| 6 | Honest production | `/api/ready` 200 on Netlify with commitSha (#178); needs `SUPABASE_SERVICE_ROLE_KEY` (owner) **and** #178 (commitSha, open) | **[blocked]**: owner key + #178 review |
| 7 | Single capability model | client-only module retired (#156 ✓); one server schema generates TS + Swift `NexusCapability`; contract test (#184) | **[in progress]** |
| 8 | Exactly-once execution | `Idempotency-Key` required on execution creation (durable `nexus_execution_requests` claim/replay already exists in Supabase mode; memory mode bounded by #186), and a replay returns the same execution id; resume stays CAS-idempotent (path-scoped request id); intents stay compose-only | **[in progress]**: durable path exists, needs a working Supabase (owner key) + key made mandatory |
| 9 | iOS peer parity | Xcode app target builds `ios/App`; iOS composes, executes **and approves/resumes** through `ResonanceCore`; Swift contract tests share web fixtures; device acceptance recorded with real evidence | **[in progress]**: library only, no app target, no resume in NexusClient |
| 10 | Finished Nexus | web + iOS complete compose → execute → approve end-to-end against production; failover (#188); runbook (#197); 7 consecutive days of Resonance-only `/api/ready` 200 (cross-product portfolio probes are monitoring only, never a gate) | **[in progress]** |
