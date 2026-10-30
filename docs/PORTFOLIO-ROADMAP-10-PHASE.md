# Portfolio 10-phase roadmap — refreshed 2026-10-30 (full audit + harden + stabilize + hygiene prune + innovate)

**Live probe evidence (2026-10-30):**
- Conduit https://conduit-feco.onrender.com/ready : **ready OK** (HTTP 200, version 0.8.0, contractRevision 2026-10-03-ready-surface, persistence postgres, production true). Warm.
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (HTTP 200, missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, contractRevision=2026-10-03-owner-gate).
- Vercel aliases: resonance.vercel.app 200 (stranger_occupant). Drift persists; never gate on non-owned.
- Open PR counts: QuicksilverV1 18, Conduit 19, Resonance 23. Residual entropy; target <10.
- CHR-55: In Review Urgent. Device Archive IPA on iPhone 16e/iOS 27 sole critical path. deviceAcceptance=not_recorded.
- CI: main green. No open Dependabot alerts observed.
- Portfolio maturity ~7.4/10 when both warm. Scores: QS ~7.6, Conduit ~7.5, Resonance ~7.1.
- Dominant risks: CHR-55 device evidence + PR entropy + alias drift + githubAdapterConfigured=false + free-tier cold starts (recoverable).

Brutal assessment: Stabilization holds. Fail-closed confirmed. Architecture solid. Not production-ready for Quicksilver until real device IPA evidence. Hygiene debt (PR entropy + docs sprawl) is the highest operational lever.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking).

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Review.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. Resilience tests progressing.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close superseded docs-only and overlapping hardens. Merge green non-overlapping after CI. One canonical roadmap. Prune old dated AUDIT files (keep last 3). Entropy 18/19/23 → <10.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Never invent owner evidence.

Binding: CHR-55 remains the production gate for Quicksilver. Entropy must prune. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested.

## Innovation Track
1. PortfolioPosture fail-closed + maturity scoring.
2. Probe tools with cold-start backoff.
3. Entropy dashboard + close candidates.
4. Consolidated hardens.
5. DeviceRunStamp + shareable evidence.
6. Early-401 and log-redact.
7. Cross-plane contract alignment.
8. Knip baseline.
9. Chamber advances once adapters configured.
10. Post-device diagnostics only after CHR-55.
11. Audit retention policy (last 3 only).
12. Continuous warm ready confirmation.

Highest-value next: prune open PRs and old audits, configure Resonance githubAdapter, then record CHR-55 on real iPhone. Stabilization holds. Innovate under constraints.
