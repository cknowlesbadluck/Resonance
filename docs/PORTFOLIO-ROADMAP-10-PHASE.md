# Portfolio 10-phase roadmap — refreshed 2026-11-08 22:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-08-22Z.md

**Live probe evidence (2026-11-08 ~22:01Z):**
- Conduit https://conduit-feco.onrender.com/ready : **HTTP 200** ready (0.8.0, postgres, production true, contractRevision 2026-10-03-ready-surface). Diagnostics all ok.
- Resonance https://resonancenexus.netlify.app/api/ready : **HTTP 200** ready OK (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, contractRevision=2026-10-03-owner-gate, timestamp 2026-11-08T22:01:06.452Z). Owner gate cleared.
- Open PR entropy: QuicksilverV1 17, Conduit 20, Resonance 25. Target <10. Entropy remains the operational killer. Pure docs mirrors (#413 QS, #253 Resonance, #347 Conduit) and pure Bolt/Jules micro-opts are close candidates (interactive forms for destructive actions).
- CHR-55: In Review Urgent. deviceAcceptance=not_recorded. Sole critical path for Quicksilver production.
- Portfolio maturity ~7.6/10 when both warm. Scores stable: QS ~7.7, Conduit ~7.6, Resonance ~7.3.
- No secrets invented. No device claim. Free-tier cold starts recoverable.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Stranger occupant confirmed. Never gate on non-owned.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA evidence.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Review Urgent. DeviceRunStamp + share evidence in flight.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing (QS #410 candidate for fold).

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. Dependabot residuals (undici high on QS development, hono medium on Conduit) are low-risk hygiene.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close docs-only superseded and pure micro-opts (Bolt/Jules). Merge green hardens with no file overlap after CI. One canonical roadmap.
**Innovate:** Enhanced entropy scoring (age + docs-only + Bolt/Jules flag + file overlap - CI green). Interactive confirmation forms for pure noise closes. Continuous probe refresh. Auto-detect pure noise for owner one-click.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets. Non-blocking for core readiness.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens and privacy reason declarations in flight (QS #411).

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence. Cross-plane probe dashboard.

Binding: CHR-55 remains the production gate for Quicksilver. Entropy must prune. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested. undici / hono patches low-risk hygiene.

Highest-value next: Owner confirm close of pure noise PRs (docs mirrors + pure Bolt micro-opts), merge green non-overlapping hardens after CI (QS #410/#411/#412, Resonance #251, Conduit selected Jules), patch medium Dependabot, configure Resonance githubAdapter if desired, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is the current killer.

Date: 2026-11-08 22:00 UTC
