# Portfolio 10-phase roadmap — refreshed 2026-11-11 09:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-11-09Z.md (prior 07Z / 02Z)

**Live probe evidence (2026-11-11 ~09:00Z):**

- Conduit https://conduit-feco.onrender.com/ready : **HTTP 200 ready** (0.8.0, postgres, production true, contractRevision 2026-10-03-ready-surface). Warm.
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed). Owner gate cleared. Timestamp ~2026-11-11T09:01Z.
- Open PR entropy (exact): QuicksilverV1 **5**, Resonance **23**, Conduit **10**. Total **38**. Improved. Target <10. Remaining primarily hardens and hygiene scripts.
- CHR-55: In Review. deviceAcceptance=not_recorded.
- Portfolio maturity ~7.7/10 when both warm.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Stranger occupant confirmed. Never gate on non-owned.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Review. Share path via Diagnostics ready.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. undici / @hono/node-server patches pending (low-risk hygiene).

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close pure noise if any remain. Merge green hardens with no file overlap after CI. One canonical roadmap.
**Innovate:** Enhanced entropy scoring (age + docs-only + Bolt/Jules flag + overlap - CI green). Interactive close forms for pure noise. Continuous probe refresh. Auto-report top close candidates. Direct main updates for docs hygiene.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens in flight. Privacy reason guards.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.

**Binding:** CHR-55 remains the production gate for Quicksilver. Entropy must prune. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested. undici / hono patches low-risk hygiene.

**Highest-value next:** Merge green non-overlapping hardens after CI review (early-401 cluster, redaction, policy), patch medium/high Dependabot (undici gateway, hono), configure Resonance githubAdapter if desired, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is the current killer.

Date: 2026-11-11 09:00 UTC
