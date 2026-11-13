# Portfolio 10-phase roadmap — refreshed 2026-11-13 ~07:01 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-13-0701Z.md (prior: AUDIT-2026-11-13-0101Z.md)

**Live probe evidence (2026-11-13 ~07:01Z):**

- Conduit https://conduit-feco.onrender.com/ready : **HTTP 200 ready** (version 0.8.0, contractRevision 2026-10-03-ready-surface, persistence postgres, production true). Warm.
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, timestamp 2026-11-13T07:01:31.814Z). Owner gate cleared.
- Open PR entropy: QuicksilverV1 **1**, Resonance **4**, Conduit **2**. Total **7**. Target <10. Held from 01:01Z. Remaining: Spotlight (#416), RLS (#265 green), indexes (#208), verify-rls (#196), drafts (#321/#120/#250).
- CHR-55: In Progress. deviceAcceptance=not_recorded.
- Portfolio maturity ~8.6/10 (both warm, entropy at 7).

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Stranger occupant confirmed on resonance.vercel.app. Never gate on non-owned.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Progress. Share path via Diagnostics ready. Highest remaining gate for QS ship. Recent packaging icon validation landed (#417).

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing. Dynamic Type a11y landed (#418). Spotlight opt-in in #416.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. Dependabot residual low-risk hygiene.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Currently 7 total. Close pure noise if any remain. Merge green hardens with no file overlap after CI. One canonical roadmap.
**Innovate:** Enhanced entropy scoring (age + docs-only + Bolt/Jules flag + overlap - CI green). Interactive close forms for pure noise. Continuous probe refresh. Auto-report top close candidates. Direct main updates for docs hygiene. Cold-start timing in probes. Owner action queue for migrations/env. Prune historical AUDIT files >30d into archive/ and delete stale audit/* branches.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets. Low priority until entropy down and owner actions complete.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Privacy reason guards. RLS lock-down (#265) green pending owner apply. URL userinfo redaction pending.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.

**Binding:** CHR-55 remains the production gate for Quicksilver. Entropy must stay pruned. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested. Owner must apply pending migrations (#265 RLS, #208 indexes) and set env before certain merges. undici / hono patches low-risk hygiene.

**Highest-value next:** Execute owner actions (apply SQL migrations #265/#208 after review, configure optional githubAdapter), review remaining drafts, merge #416 after CI, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is now low; focus shifts to owner gates and device evidence.

**Innovations proposed / implemented:**
1. Entropy scoring scripts already present in Conduit (entropy-score.mjs, entropy-dashboard.mjs, etc.) — rank by age, type, overlap, CI status → daily report of close candidates.
2. Probe script enhancements with cold-start timing and auto-recovery logging already in portfolio-probe.mjs (retries on 503).
3. Hygiene bot or manual queue for owner-gated items (migrations list, env checklist) — decision-queue.mjs exists.
4. Direct docs commits for living audits to reduce PR noise (this update and companion AUDIT).
5. Historical AUDIT consolidation + stale branch cleanup recommendation.
6. **New this pass:** Fresh 07:01Z audit + roadmap committed directly to main; both planes confirmed warm; entropy held at 7; owner action priority elevated.

Date: 2026-11-13 ~07:01 UTC
