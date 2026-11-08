# Portfolio 10-phase roadmap — refreshed 2026-11-08 12:05 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-08-12Z.md

**Live probe evidence (2026-11-08 ~12:01Z):**
- Conduit https://conduit-feco.onrender.com/ready : HTTP 503 (free-tier cold start, recoverable). Was 200 at 11:01Z.
- Resonance https://resonancenexus.netlify.app/api/ready : HTTP 200 ready OK (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed). Timestamp 2026-11-08T12:01:04.201Z. Owner gate cleared.
- Open PR entropy: QuicksilverV1 17, Conduit 20, Resonance 25. Target <10. Noise close candidates presented.
- CHR-55: In Review. deviceAcceptance=not_recorded.
- Portfolio maturity ~7.5/10 when both warm.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Stranger occupant confirmed.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Review.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing (QS #410 candidate).

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. undici upgrade pending.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close docs-only superseded and pure micro-opts (Bolt/Jules). Merge green hardens with no file overlap after CI. One canonical roadmap.
**Innovate:** entropy dashboard script + close-candidate prioritization by age, CI, overlap, Jules/Bolt/docs flag. Continuous probe refresh in practice. **Implemented:** scripts/entropy-probe.mjs on this branch.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens in flight.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.

Binding: CHR-55 remains the production gate for Quicksilver. Entropy must prune. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested. undici patch low-risk hygiene.

Highest-value next: confirm close of pure noise PRs (docs mirrors + pure micro-opts), merge green non-overlapping hardens after CI, configure Resonance githubAdapter, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is the current killer.

Date: 2026-11-08 12:05 UTC
