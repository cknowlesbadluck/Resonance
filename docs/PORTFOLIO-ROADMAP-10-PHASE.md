# Portfolio 10-phase roadmap — refreshed 2026-11-03 17:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-03-17Z.md

**Live probe evidence (2026-11-03 ~17:00Z):**
- Conduit https://conduit-feco.onrender.com/ready : **ready OK** (0.8.0, postgres, production true, contractRevision 2026-10-03-ready-surface). Warm.
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, contractRevision=2026-10-03-owner-gate, timestamp 2026-11-03T17:00:43.140Z). Owner gate cleared. Warm.
- Vercel aliases: resonance.vercel.app 200 (stranger_occupant / Detail Framework risk confirmed); resonancenexus.vercel.app 404. Drift persists; never gate on non-owned.
- Open PR counts (exact): QuicksilverV1 17, Conduit 24, Resonance 23. Residual entropy; target <10. Green non-overlapping hardens remain merge candidates. Bolt micro-opts remain close-candidates.
- CHR-55: In Review Urgent. Device Archive IPA on iPhone 16e/iOS 27 sole critical path. deviceAcceptance=not_recorded.
- CI: main green across planes when warm. Free-tier cold starts recoverable.
- Portfolio maturity ~7.5/10 when both warm. Scores: QS ~7.7, Conduit ~7.6, Resonance ~7.2. Dominant risks: CHR-55 device evidence + PR entropy + alias drift + githubAdapterConfigured=false + free-tier cold starts (recoverable).
- No secrets invented. No device claim. Classifier ≠ proof. See docs/AUDIT-2026-11-03-17Z.md.

Brutal assessment: Stabilization holds. Fail-closed posture confirmed and sustained when warm. Architecture solid. Not production-ready for Quicksilver until real device IPA evidence. Hygiene debt (PR entropy) remains the highest operational lever. Prune of pure Bolt noise attempted (gated).

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking, informational only). Stranger occupant on resonance.vercel.app confirmed.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI/Swift package tests insufficient. Linear CHR-55 In Review.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. Probe tools distinguish cold.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Docs-only superseded closed. Merge green hardens with no file overlap after CI green. One canonical roadmap. Mirror audit notes. Entropy score: current 17/24/23 → target <10. **Innovate:** entropy dashboard script + close-candidate prioritization. Score PRs by age, CI status, file overlap, and docs-only/Jules/Bolt flag for automated close candidates. Continuous probe refresh already in practice. Pure Bolt micro-opts identified as immediate close candidates.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify host. Advance secondary clients under constraints. githubAdapterConfigured remains false until owner sets.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens in flight.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence. Warm ready is the confirmed baseline.

Binding: CHR-55 remains the production gate for Quicksilver. Entropy and alias must prune. Free-tier cold starts OK if they recover to ready. No auto-merge of overlapping or untested.

Highest-value next: merge green non-overlapping hardens after CI, configure Resonance githubAdapter on host, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is the current killer.
