# Portfolio 10-phase roadmap — refreshed 2026-11-11 04:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-11-04Z.md (prior 00Z / 22Z / 19Z / 13Z / 08Z)

**Live probe evidence (2026-11-11 ~04:00Z):**

- Conduit https://conduit-feco.onrender.com/ready : **HTTP 200 ready** (0.8.0, postgres, production true, contractRevision 2026-10-03-ready-surface). Warm.
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, timestamp 2026-11-10T16:02:29.480Z). Owner gate cleared. Fail-closed holds.
- Open PR entropy (exact): QuicksilverV1 17, Resonance 26, Conduit 21. Total 64. Target <10. Pure docs mirrors + Bolt micro-opts + gemini micro close candidates: #413 QS, #253/#254/#256 Resonance, #347/#348/#349/#350/#351 Conduit. Forms presented; still open pending owner Submit.
- CHR-55: In Review. deviceAcceptance=not_recorded.
- Portfolio maturity ~7.6/10 when both warm.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Stranger occupant confirmed. Never gate on non-owned.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Review. Share path via Diagnostics (#412) ready.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing (QS #410 candidate).

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. undici / @hono/node-server patches pending (low-risk hygiene).

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close docs-only superseded and pure micro-opts (Bolt/Jules). Merge green hardens with no file overlap after CI. One canonical roadmap.
**Innovate:** Enhanced entropy scoring (age + docs-only + Bolt/Jules flag + overlap - CI green). Interactive close forms for pure noise. Continuous probe refresh. Auto-report top close candidates.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens in flight. Privacy reason guards.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.

**Binding:** CHR-55 remains the production gate for Quicksilver. Entropy must prune. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested. undici / hono patches low-risk hygiene.

**Highest-value next:** Submit the pure-noise close forms, merge green non-overlapping hardens after CI, patch medium/high Dependabot (undici gateway, hono), configure Resonance githubAdapter if desired, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is the current killer.

Date: 2026-11-11 04:00 UTC
