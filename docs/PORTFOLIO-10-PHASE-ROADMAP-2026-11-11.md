# Portfolio 10-Phase Roadmap — 2026-11-11

**Full audit executed. Do not wait for approval per owner directive.**

Cross-project plan for QuicksilverV1, Resonance, Conduit. Priority: hygiene + stabilization first, then high-leverage innovation that advances presence (Quicksilver) and governed composition (Resonance) without domain coupling.

## Executive Verdicts

### QuicksilverV1
Alpha. Architecture solid (Sense→Think→Express, aspect model, on-device first). Biggest risk: no recent physical device IPA evidence (CHR-55) + branch entropy. Scores ~6.5/10 average. Not production-ready.

### Resonance
Early alpha / prototype. Vision clear, phases defined, but binding constraint is production host readiness + capability convergence + live evidence. High open-PR and branch entropy. Scores ~4/10 vs finished vision.

### Conduit
Most mature (0.8). Deployed, MCP contract solid. Needs hygiene on bolt/* branches and DB TLS rollout. Scores ~7/10.

**Portfolio biggest risk:** Entropy and incomplete evidence loops. Too many audit branches, stale PRs, missing device/prod gates.

## Hygiene & Prune (Immediate)
- Close superseded audit docs PRs and old draft PRs.
- Delete or archive stale `audit/*`, `bolt/*`, `docs/audit-*` branches older than 14 days with no open PR.
- Merge or close high-value open PRs that are green and non-conflicting (owner merge authority remains).
- Enforce branch protection + required CI on all three.

## 10-Phase Roadmap (Sequential, High-Leverage)

**Phase 0 — Stabilize & Hygiene (current, 1 week)**
- Goals: Prune branches/PRs, green CI everywhere, update living roadmaps, capture current device/prod evidence gaps.
- Exit: Open PR count <5 per repo, branch count reduced 50%, all main CI green, CHR-55 status documented.

**Phase 1 — Evidence Gates (Quicksilver + Resonance)**
- Device IPA validation for Quicksilver (CHR-55). Live `/api/ready` 200 + secrets for Resonance.
- Exit: Signed or SideStore IPA installed and smoke-tested on iPhone 16e; Resonance prod ready endpoint green.

**Phase 2 — Capability Convergence (Resonance)**
- Single NexusCapability model everywhere; retire dual shapes; live DB rows match publication.
- Exit: No client-only capability decoding; integration tests prove one model.

**Phase 3 — Hardening Pass (all)**
- Security: auth mode required defaults, TLS verify, redaction, Dependabot fixes.
- Exit: No critical alerts, policy gates deny-by-default proven.

**Phase 4 — Presence Depth (Quicksilver)**
- Complete VisualState / PersonaTheme consistency, Forge/Eternal instruments, Memory resilience.
- Exit: Sanctum feels like a place; a11y + Dynamic Type tests green.

**Phase 5 — Chamber Vertical Slice (Resonance)**
- Full Agenda → Chamber form/work/dissolve with durable evidence and policy.
- Exit: End-to-end chamber scenario with audit trail on main.

**Phase 6 — Native Peer Parity (Resonance iOS + Quicksilver bridge)**
- iOS compose/execute/approve loop; App Intents surface.
- Exit: Same intent→evidence flow on phone as web.

**Phase 7 — Adapter Substitution Proof (Resonance)**
- At least two real adapters interchangeable under same contracts.
- Exit: Swap provider without Chamber rewrite; health/cost ranking live.

**Phase 8 — Observability & Diagnostics**
- Structured logs, correlation IDs, diagnostics surfaces across planes.
- Exit: Trace any execution from intent to evidence without manual grep.

**Phase 9 — Innovation: Living Composition**
- Quicksilver aspects can seed Resonance Chambers; Resonance evidence feeds Quicksilver Memory (privacy-gated).
- Exit: One governed flow spans mobile presence and control plane without coupling cores.

**Phase 10 — Release Hardening & 1.0 Gate**
- Full smoke, entropy locked, privacy manifests, SideStore path proven, post-deploy monitoring.
- Exit: Production-ready declaration with owner sign-off and public or private release artifacts.

## Innovative Implementations (Immediate + Near)
1. **Portfolio Probe Dashboard** (Conduit scripts): Cross-plane ready + PR entropy + close candidates. Fail-closed.
2. **Capability Bridge Strict Mode** (Resonance): Runtime assert single model; reject dual decode.
3. **Aspect-Aware Chamber Seed** (Quicksilver → Resonance): Optional, policy-gated intent export from Brain to Nexus Agenda. No domain leak.

## Risks Remaining
- Owner-blocked secrets and device access.
- Entropy re-accumulation without continuous prune discipline.
- Domain coupling if innovation phases are rushed.

## Recommendation
Execute Phase 0 fully this session. Then Phase 1 evidence gates. Do not open new feature branches until entropy is low and evidence exists.

*Generated under owner directive: full audit + innovate implementation, no approval wait.*
