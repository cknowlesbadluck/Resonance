# Portfolio 10-Phase Roadmap — refreshed 2026-11-02 (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** this file in Resonance (mirrors in Conduit/QuicksilverV1 for convenience).

**Live probe evidence (2026-11-02 ~05:02Z):**
- Conduit /ready: ready OK (0.8.0, postgres, production true).
- Resonance /api/ready: ready OK (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, authMode=required).
- Open PR counts (approx): QuicksilverV1 ~20, Resonance ~25, Conduit ~24. Target <10. Many Bolt micro-opts and docs mirrors.
- CHR-55: In Review. Device Archive IPA on iPhone 16e/iOS 27 sole critical path. deviceAcceptance=not_recorded.
- CI main green. Dependabot residual low.

Brutal assessment: Stabilization holds. Fail-closed confirmed when warm. Architecture solid. Not production-ready for Quicksilver until real device IPA evidence. Hygiene debt (PR entropy) remains the highest operational lever.

## Phase 1 — Immediate Hygiene Prune (this sprint)
Goals: Close or delete all pure docs/audit mirror branches and Jules/Bolt micro-opt PRs that do not change behavior. Merge green non-overlapping hardens (QS privacy/intents/memory clamps, Resonance early-401s).  
Exit: Open PRs ≤10 per repo. Stale branches without PRs deleted. One canonical audit + roadmap committed.  
Innovate: entropy score script gates CI.

## Phase 2 — CHR-55 Device Gate
Goals: Archive IPA on real iPhone 16e / iOS 27, install via SideStore, record DeviceRunStamp evidence, mark CHR-55.  
Exit: deviceAcceptance recorded by owner. Linear done.

## Phase 3 — Auth Fail-Closed Complete
Goals: Land remaining early-401, log redaction, route matrix. Confirm RESONANCE_AUTH_MODE=required.  
Exit: Anonymous traffic always 401 on non-public routes. Tests green on main.

## Phase 4 — Adapter Configuration
Goals: Owner sets GITHUB_TOKEN + webhook secret on Resonance Netlify. Verify githubAdapterConfigured=true.  
Exit: Live GitHub adapter vertical slice produces durable evidence.

## Phase 5 — Memory / Budget Hardening (QS)
Goals: Finish remaining memory resilience tests, importance sanitize, budgets, IntegrationEventStore cap.  
Exit: AppTests green at scale. No unbounded stores.

## Phase 6 — Chamber Persistence (Resonance)
Goals: Persist Chamber scenario in Supabase, surface in control plane.  
Exit: Form → work → dissolve with audit intact, survives restart.

## Phase 7 — iOS Native Peer (Resonance + QS alignment)
Goals: Single capability model, compose/execute/approve loop on iOS.  
Exit: Intent → plan → approve → evidence on device.

## Phase 8 — Observability & Probe Hardening
Goals: Cold-start classifier in every probe. Entropy trend gate. Deploy-parity check.  
Exit: Probes distinguish cold from down. No false outages.

## Phase 9 — Privacy / Logging Strict
Goals: Full redaction, Privacy Manifest reasons complete, no body logging.  
Exit: Guards green. Manifest matches shipped APIs.

## Phase 10 — Cross-Plane Acceptance & 1.0 Prep
Goals: Unified acceptance harness. Semver 1.0 contracts. Runbooks.  
Exit: All gates green, entropy <10 sustained 30 days, device evidence present, ready warm. Production verdict.

Binding: CHR-55 remains the production gate for Quicksilver. Entropy must prune. Free-tier cold starts OK if they recover to ready. No auto-merge of overlapping or untested.

Highest-value next: merge green non-overlapping hardens after CI, configure Resonance githubAdapter on host, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence.
