# Portfolio 10-phase roadmap — refreshed 2026-11-02 21:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-02-FULL-PORTFOLIO.md

**Live probe evidence (2026-11-02 ~21:00Z):**
- Conduit https://conduit-feco.onrender.com/ready : **ready OK** (HTTP 200, 0.8.0, postgres, production true, contractRevision 2026-10-03-ready-surface). Warm.
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (HTTP 200, missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, contractRevision=2026-10-03-owner-gate, timestamp 2026-11-02T21:00:47.721Z). Owner gate cleared. Warm.
- Vercel aliases: resonance.vercel.app 200 (stranger_occupant risk); resonancenexus.vercel.app 404. Drift persists; never gate on non-owned.
- Open PR counts (exact): QuicksilverV1 18, Conduit 23, Resonance 23. Residual entropy; target <10. Green non-overlapping hardens remain merge candidates (QS #392/#408/#410/#412, Resonance early-401s). Jules Bolt micro-opts on Conduit are close-candidates.
- CHR-55: In Review Urgent. Device Archive IPA on iPhone 16e/iOS 27 sole critical path. deviceAcceptance=not_recorded. DeviceRunStamp + share evidence in flight (#392/#412).
- CI: main green across planes when warm. Free-tier cold starts recoverable.
- Portfolio maturity ~7.4/10 when both warm. Scores: QS ~7.6, Conduit ~7.5, Resonance ~7.2. Dominant risks: CHR-55 device evidence + PR entropy + alias drift + githubAdapterConfigured=false + free-tier cold starts (recoverable).
- No secrets invented. No device claim. Classifier ≠ proof. See docs/AUDIT-2026-11-02-FULL-PORTFOLIO.md.

Brutal assessment: Stabilization holds. Fail-closed posture confirmed and sustained when warm. Architecture solid. Not production-ready for Quicksilver until real device IPA evidence. Hygiene debt (PR entropy) remains the highest operational lever.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking, informational only).

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI/Swift package tests insufficient. Linear CHR-55 In Review.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. Probe tools distinguish cold.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Docs-only superseded closed. Merge green hardens with no file overlap after CI green. One canonical roadmap. Mirror audit notes. Entropy score: current 18/23/23 → target <10. **Innovate:** entropy dashboard script + close-candidate prioritization. Score PRs by age, CI status, file overlap, and docs-only/Jules flag for automated close candidates.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify host. Advance secondary clients under constraints. githubAdapterConfigured remains false until owner sets.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens in flight.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence. Warm ready is the confirmed baseline.

Binding: CHR-55 remains the production gate for Quicksilver. Entropy and alias must prune. Free-tier cold starts OK if they recover to ready. No auto-merge of overlapping or untested.

Highest-value next: merge green non-overlapping hardens after CI (QS #392 then #412, #408, #410), configure Resonance githubAdapter on host, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is the current killer.
