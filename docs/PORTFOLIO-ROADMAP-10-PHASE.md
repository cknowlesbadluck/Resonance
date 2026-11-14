# Portfolio 10-phase roadmap — refreshed 2026-11-14 ~02:02 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-14-02Z.md (prior: AUDIT-2026-11-14-0103Z.md)

**Live probe evidence (2026-11-14 ~02:02Z):**

- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, timestamp ~2026-11-14T02:01:54Z). Warm (~0.60s).
- Conduit https://conduit-feco.onrender.com/ready : **ready OK** (0.8.0, postgres, production true). Warm (~0.18s). Recovered from cold-start.
- Open PR entropy: QuicksilverV1 **3**, Resonance **4**, Conduit **2**. Total **9**. Target <10. Held.
- Stale branches: High volume of audit/* and docs/audit-* on Resonance (hygiene prune candidates).
- Dependabot: Conduit Hono mediums (upgrade >=4.13.16); QuicksilverV1 undici high in gateway (dev). Resonance clean.
- CHR-55: In Progress. deviceAcceptance=not_recorded.
- Portfolio maturity ~8.4/10 (both warm, entropy at 9, residual security patches and branch debt).

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Never gate on non-owned.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Progress. Highest remaining gate for QS ship.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. Spotlight opt-in in #422 ready for review.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. Dependabot residual hygiene (Hono/undici).

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Currently 9 total. Close pure noise if any remain. Merge green hardens with no file overlap after CI. One canonical roadmap.
**Innovate:** Enhanced entropy scoring (age + docs-only + Bolt/Jules flag + overlap - CI green). Interactive close forms for pure noise. Continuous probe refresh. Auto-report top close candidates. Direct main updates for docs hygiene. Cold-start timing in probes. Owner action queue for migrations/env. Prune historical AUDIT files >30d into archive/ and delete stale audit/* branches. Fresh 02:02Z audit + roadmap + owner-action-queue.mjs. **New: elevated branch entropy as explicit prune target.**

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets. Low priority until entropy down and owner actions complete.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Privacy reason guards. RLS lock-down (#265) green pending owner apply. URL userinfo redaction pending. Hono security patches.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.

**Binding:** CHR-55 remains the production gate for Quicksilver. Entropy must stay pruned. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested. Owner must apply pending migrations (#265 RLS, #208 indexes) and set env before certain merges. undici / hono patches low-risk hygiene.

**Highest-value next:** Execute owner actions (apply SQL migrations #265/#208 after review, configure optional githubAdapter), review remaining drafts, merge #422 after CI, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is 9; focus shifts to owner gates, device evidence, branch hygiene.

**Innovations proposed / implemented:**
1. Entropy scoring scripts already present — rank by age, type, overlap, CI status → daily report of close candidates.
2. Probe script enhancements with cold-start timing and auto-recovery logging already in portfolio-probe.mjs.
3. Hygiene bot or manual queue for owner-gated items (migrations list, env checklist). **New: owner-action-queue.mjs.**
4. Direct docs commits for living audits to reduce PR noise (this update and companion AUDIT).
5. Historical AUDIT consolidation + stale branch cleanup recommendation.
6. **New this pass:** Fresh 02:02Z audit + roadmap + owner-action-queue.mjs; both planes confirmed warm with response times; entropy at 9 documented; branch hygiene debt elevated as prune target; owner action priority elevated.

Date: 2026-11-14 ~02:02 UTC
