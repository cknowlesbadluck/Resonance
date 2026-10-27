# Portfolio 10-phase roadmap — refreshed 2026-10-27 00:01 UTC (full audit + harden + stabilize + hygiene prune + innovate)

Live probes 2026-10-27T00:01Z:
- Conduit https://conduit-feco.onrender.com/ready : **ready** (HTTP 200 after cold-start recovery ~39s, version 0.8.0, contractRevision 2026-10-03-ready-surface, persistence postgres, production true). Warm after retry.
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (HTTP 200, missingRequired=[], production true, authMode required ok, persistenceConfigured true, posture=contract_passed, contractRevision=2026-10-03-owner-gate, githubAdapterConfigured=false). Timestamp 2026-10-27T00:01:46.857Z.
- Vercel aliases: resonance.vercel.app 200 (stranger_occupant). resonancenexus.vercel.app 404. Drift persists; never gate.
- Open PR counts: QuicksilverV1 ~18, Conduit ~16, Resonance ~23. Residual entropy; target <10. Candidates: merge green non-overlapping hardens (QS #408/#409/#410/#411, Conduit #335/#336, Resonance #246/#248/#251); close superseded docs-only.
- CHR-55: open (Urgent). Device Archive IPA on iPhone 16e/iOS 27 sole critical path. deviceAcceptance=not_recorded. DeviceRunStamp + share evidence in flight (#392/#412).
- CI: main green. No Dependabot alerts.
- Portfolio maturity ~7.4/10 (owned planes warm). Scores: QS ~7.6, Conduit ~7.5, Resonance ~7.1. Dominant risks: CHR-55 + PR entropy + alias drift + githubAdapter=false.
- No secrets. No device claim. Classifier ≠ proof. Cold-start distinguished from not-ready.

Brutal assessment: stabilization holds. Fail-closed posture confirmed. Architecture solid across planes. Not production-ready for QS until device evidence. Hygiene debt is the highest operational lever now.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking).

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target device only. Simulator/CI insufficient.

## Phase 5 — Memory and conversation budgets
Bounded, on-device. AppTests green.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start 503 retryable.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close docs-only superseded. Merge green hardens with no file overlap. One canonical roadmap. Mirror audit notes.

## Phase 8 — Resonance adapters
Configure githubAdapter on host. Advance secondary clients under constraints.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors.

## Phase 10 — Cross-plane acceptance
Probe + device evidence. Production verdict only after all.

Binding: CHR-55 remains. Entropy and alias must prune. Free-tier cold starts OK if recover.

## Innovation Track
1. PortfolioPosture fail-closed + maturity scoring (owned-only).
2. Probe tools with exponential cold-start backoff (landed).
3. Entropy dashboard + automated close candidates (Conduit #333 in flight).
4. Consolidated hardens and surface guards (in flight across repos).
5. On-device DeviceRunStamp + shareable redacted evidence (post-CHR-55 scaffolding).
6. Early-401 and log-redact hardens.
7. Cross-plane contract alignment.
8. Knip baseline for planned adapters.
9. Chamber/capability advances unblocked.
10. Post-device diagnostics only.

Highest-value next: execute hygiene prune (close/merge candidates), configure Resonance githubAdapter, then CHR-55 device IPA. Stabilization holds. Innovate under constraints.
