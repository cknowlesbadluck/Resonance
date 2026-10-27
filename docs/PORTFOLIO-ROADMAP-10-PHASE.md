# Portfolio 10-phase roadmap — refreshed 2026-10-27 02:01 UTC (full audit + harden + stabilize + hygiene prune + innovate)

Live probes 2026-10-27T02:01Z:
- Conduit https://conduit-feco.onrender.com/ready : **ready** (HTTP 200, version 0.8.0, contractRevision 2026-10-03-ready-surface, persistence postgres, production true).
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (HTTP 200, missingRequired=[], production true, authMode required ok, persistenceConfigured true, posture=contract_passed, contractRevision=2026-10-03-owner-gate, githubAdapterConfigured=false). Timestamp 2026-10-27T02:01:22.587Z.
- Vercel aliases: resonance.vercel.app 200 (stranger_occupant HTML). resonancenexus.vercel.app 404 DEPLOYMENT_NOT_FOUND. quicksilver.vercel.app 200 stranger. quicksilverv1.vercel.app 404. Drift persists; never gate on non-owned.
- Open PR counts: QuicksilverV1 18, Conduit 16, Resonance 23. Residual entropy; target <10. Candidates for prune: close superseded docs-only (Resonance #240, QS #406, Conduit #338); merge green non-overlapping hardens after CI confirm (QS #408-411, Conduit #335/#336, Resonance #246/#248/#251).
- CHR-55: In Review Urgent. Device Archive IPA on iPhone 16e/iOS 27 sole critical path. deviceAcceptance=not_recorded. DeviceRunStamp + share evidence in flight (#392/#412).
- CI: main green across planes. No open Dependabot alerts.
- Portfolio maturity ~7.4/10 (owned planes warm and contract_passed). Scores: QS ~7.6, Conduit ~7.5, Resonance ~7.1. Dominant risks: CHR-55 device evidence + PR entropy + alias drift + githubAdapterConfigured=false.
- No secrets invented. No device claim. Classifier ≠ proof. Cold-start distinguished from not-ready.

Brutal assessment: Stabilization holds. Fail-closed posture confirmed on both planes. Architecture solid. Not production-ready for Quicksilver until real device IPA evidence. Hygiene debt (PR entropy) is the highest operational lever now. Innovation continues under constraints.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking, informational only).

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI/Swift package tests insufficient. Linear CHR-55 In Review.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close docs-only superseded immediately. Merge green hardens with no file overlap after CI green. One canonical roadmap (this file). Mirror audit notes to other repos.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify host. Advance secondary clients under constraints. githubAdapterConfigured remains false until owner sets.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.

Binding: CHR-55 remains the production gate for Quicksilver. Entropy and alias must prune. Free-tier cold starts OK if they recover to ready. No auto-merge of overlapping or untested.

## Innovation Track
1. PortfolioPosture fail-closed + maturity scoring (owned-only targets).
2. Probe tools with exponential cold-start backoff (landed).
3. Entropy dashboard + automated close candidates (Conduit #333 in flight).
4. Consolidated hardens and surface guards (in flight across repos).
5. On-device DeviceRunStamp + shareable redacted evidence (post-CHR-55 scaffolding, #392/#412).
6. Early-401 and log-redact hardens (Resonance #244/#246/#251 etc.).
7. Cross-plane contract alignment and ready-surface pins.
8. Knip baseline for planned adapters.
9. Chamber/capability advances unblocked once adapters configured.
10. Post-device diagnostics and full production verdict only after CHR-55.

Highest-value next: execute hygiene prune (close docs-only #240/#406/#338 now; merge green non-overlapping hardens after CI), configure Resonance githubAdapter on host, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence.
