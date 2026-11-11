# PORTFOLIO-ROADMAP-10-PHASE.md (refreshed 2026-11-11 11Z)

**Live probe evidence (2026-11-11 ~11:00Z):**  
Conduit ready 200 (recovered from cold). Resonance ready 200 OK (missingRequired=[], githubAdapterConfigured=false, posture=contract_passed).  
Open PRs: QS 3 / Resonance 8 / Conduit 7. Total **18**. Target <10. Entropy largely resolved.  
CHR-55 sole critical path for QS. deviceAcceptance=not_recorded.  
Portfolio maturity ~7.8/10 when both warm.

## Phase 1 — Owner gate cleared  
**Status: Met.** missingRequired=[], posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict  
**Status: Met.** Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Stranger occupant confirmed. Never gate on non-owned.

## Phase 3 — Device fence immutable  
**Status: Met.** claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA. DeviceRunStamp scaffolding complete.

## Phase 4 — CHR-55 sole device gate  
**Status: Open (critical).** Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Share path via Diagnostics ready. Linear In Progress.  
**Innovate:** Shortcuts-based on-device install + evidence export automation (owner-triggered only).

## Phase 5 — Memory and conversation budgets  
**Status: Progressing.** Bounded, on-device first. AppTests green. Resilience tests hold. Spotlight opt-in (#414) and content-free diagnostics (#415) in flight.

## Phase 6 — Gateway free-tier contract  
**Status: Met.** No paid bindings. Cold-start recoverable. Free-only AI path. Residual Dependabot hygiene pending.

## Phase 7 — Hygiene prune  
**Status: Largely met.** Open PRs <10/repo achieved (total 18). Close residual pure noise if any. Merge green hardens with no file overlap after CI. One canonical roadmap.  
**Innovate:** Daily auto entropy scorer + close-candidate report (age*0.4 + docs + bolt/jules - CI). Interactive forms. Continuous probe refresh.

## Phase 8 — Resonance adapters  
**Status: Pending owner.** Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets. Event RPC migration (#255) and indexes (#208) ready for review.

## Phase 9 — Privacy and logging strict  
**Status: Progressing.** Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens and URL redact in flight. Privacy reason guards hold.

## Phase 10 — Cross-plane acceptance  
**Status: Blocked on Phase 4.** Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.  
**Innovate:** Cross-plane acceptance harness that consumes DeviceRunStamp + ready stamps + entropy score; fails closed without real device evidence.

Highest-value next: record CHR-55 on real device, then merge green hardens. Entropy no longer the bottleneck.
