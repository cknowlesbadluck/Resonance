# Portfolio 10-phase roadmap — refreshed 2026-11-06 18:01 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-06-18Z.md (created this pass)

**Live probe evidence (2026-11-06 ~18:01Z):**
- Conduit https://conduit-feco.onrender.com/ready : **HTTP 200** {status:ready, version:0.8.0, contractRevision:2026-10-03-ready-surface, persistence:postgres, production:true}. Warm.
- Resonance https://resonancenexus.netlify.app/api/ready : **HTTP 200 ready OK** (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, contractRevision=2026-10-03-owner-gate, timestamp=2026-11-06T18:01:41.691Z). Owner gate cleared. Warm. Fail-closed holds.
- Vercel aliases: resonance.vercel.app 200 (stranger_occupant). Drift persists; never gate on non-owned.
- Open PR counts (exact at probe): QuicksilverV1 17, Conduit 19, Resonance 24. Residual entropy; target <10. Close candidates remain docs mirrors + pure Bolt/Jules micro-opts. Entropy is the current operational killer.
- CHR-55: In Review Urgent. Device Archive IPA on iPhone 16e/iOS 27 sole critical path. deviceAcceptance=not_recorded. No simulator/CI substitutes.
- CI: main green across planes when warm. Free-tier cold starts recoverable. Dependabot undici alerts open in QS gateway.
- Portfolio maturity ~7.6/10 when both warm. Scores: QS ~7.8, Conduit ~7.6, Resonance ~7.3. Dominant risks: CHR-55 device evidence + PR entropy + alias drift + githubAdapterConfigured=false + free-tier cold starts (recoverable) + undici surface.
- No secrets invented. No device claim. Classifier ≠ proof.

Brutal assessment: Stabilization holds. Fail-closed posture confirmed and sustained when warm. Architecture solid (Sense-Think-Express, Core contracts, modular). Not production-ready for Quicksilver until real device IPA evidence. Hygiene debt (PR entropy) remains the highest operational lever. Continuous probe refresh is the innovation in practice.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking, informational only). Stranger occupant on resonance.vercel.app confirmed.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI/Swift package tests insufficient. Linear CHR-55 In Review.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing (QS #410).

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. Probe tools distinguish cold. undici upgrade pending.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Docs-only superseded closed. Merge green hardens with no file overlap after CI green. One canonical roadmap. Mirror audit notes. Entropy score: current ~17/19/24 → target <10. **Innovate:** entropy dashboard script + close-candidate prioritization. Score PRs by age, CI status, file overlap, and docs-only/Jules/Bolt flag for automated close candidates. Continuous probe refresh already in practice. Residual Bolt micro-opts and docs mirrors identified as immediate close candidates. entropy-dashboard.mjs exists in Conduit (supports --json).

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify host. Advance secondary clients under constraints. githubAdapterConfigured remains false until owner sets.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens in flight (#243-#248).

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence. Warm ready is the confirmed baseline.

Binding: CHR-55 remains the production gate for Quicksilver. Entropy and alias must prune. Free-tier cold starts OK if they recover to ready. No auto-merge of overlapping or untested. undici patch is low-risk hygiene.

Highest-value next: selective prune of pure noise PRs, merge green non-overlapping hardens after CI (QS DeviceRunStamp #412, privacy #411, memory #410; Resonance auth hardens; Conduit probe #336), upgrade undici, configure Resonance githubAdapter on host, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is the current killer.
