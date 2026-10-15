# Portfolio — 10-Phase Production-Readiness Roadmap (refined 2026-10-15 14:30 EDT)

Products: **QuicksilverV1** (primary product, iOS, owned by Quicksilver Dev), **Resonance** (provider-neutral integration plane), **Conduit** (MCP coordination bridge). These are separate repos with no shared runtime; they talk only through documented HTTP/MCP contracts. Agents never merge, apply migrations or change prod config. Current audit: `docs/AUDIT-2026-10-15.md`.

## Live evidence (13:05 EDT)
Conduit `/ready` 200 (0.8.0, postgres) · Resonance Netlify `/api/ready` 503, missing [SUPABASE_SERVICE_ROLE_KEY], older build than main · Supabase Resonance/Quicksilver INACTIVE (paused) · resonance/quicksilver.vercel.app stranger_occupant · resonancenexus/quicksilverv1.vercel.app alias_absent · CHR-55 not_recorded.

## Phases
| # | Phase | Quicksilver (read-only here) | Resonance | Conduit |
|---|---|---|---|---|
| 1 | Green, pinned CI | main green; 8 PRs merged 10-15 | #161 (blocked: Netlify auto-publish), #162, #164; owner: branch protection #165 | **#197, #214 merged**; #198; owner: disconnect Workers Builds |
| 2 | Lean code | #283–#287 (#252) consolidate | #183 lib/ai prune; chambers decision | **#220 merged**; #210 legacy posture script |
| 3 | Fail-closed auth/lockdown | (n/a) | #174 auth, #185 prod detection | #206 → #211, #212; #222 every tool scope-gated |
| 4 | Bounded surface | bounded memory (#296) | #175 rate limit, #186 idempotency bound | #217 SSE cap (on #211), #208, #207, #213, #223 activity retention |
| 5 | Transport/data security | restore its Supabase | #173 search_path (NOT applied); RLS tests next | #155 TLS (after Render env); cursors split from #162 |
| 6 | Honest posture | (n/a) | #169, #170; #178 → #179 deploy parity | #203 or #210; #218 probe → #219 schedule |
| 7 | Capability gates / composition | device plans call Resonance capabilities | #182 adapter contract; #188 provider failover; manifest + refusal (CHR-33) | capability metadata in tools/list |
| 8 | Cross-plane proof | contract client | #184 /api/ready + envelope contract | #225 tool-surface snapshot |
| 9 | Contract + coverage | tests merged 10-15 (#289–#291) | #176 → #177 → #181, #180 | #214 coverage gate, #204 perf, #216 timeouts |
| 10 | Operable release | CHR-55 device acceptance (real evidence only); fresh Archive IPA | owner: restore DB + key → `/api/ready` 200 (CHR-54); runbook | SSE drain (#119 rest), tag 0.9.0, runbook |

**Innovate:** I1 scheduled probe (#219, done) · I2 cross-plane contract (#184, done) · I3 exempt /health,/ready from bot challenge (owner config) · I4 PR-stack report (pattern exists as Quicksilver #294; not ported) · Quicksilver on-device intelligence (#282, #295, #297) · Conduit MCP: streamable sessions, resumable SSE.

## Merge order (actual bases)
- **Resonance:** #161 → {#172 → #176 → #177 → {#181, #178 → {#179, #180}}} → {#162, #164, #169, #170, #173, #174, #175, #182, #183, #184, #185, #186, #187} → #171.
- **Conduit:** #197 → #198 → #206 → {#211 → #217, #212} → #209 → #207, #208, #213 → #204 → #216 → #214 → #220, #222, #223, #224 → #210 or #203 → #218 → #219 → #155 (after Render TLS env) → #205.
- **Held:** Conduit #119/#120 (draft), #162 (split), #187/#190 (experiments). Resonance #154/#157 (experiments), #158 (rebase). Closed 10-15: Conduit #221 (superseded by #204).
