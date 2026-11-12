# Portfolio 10-phase roadmap — refreshed 2026-11-12 ~20:00 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-12-2000Z.md (prior: AUDIT-2026-11-12-1500Z.md)

**Live probe evidence (2026-11-12 ~20:00Z):**

- Conduit https://conduit-feco.onrender.com/ready : **HTTP 200 ready** (version 0.8.0, contractRevision 2026-10-03-ready-surface, persistence postgres, production true). Warm.
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, timestamp 2026-11-12T20:00:51.656Z). Owner gate cleared.
- Open PR entropy: QuicksilverV1 **3**, Resonance **6**, Conduit **3**. Total **12**. Target <10. Improved from 15 at 15:00Z. Remaining primarily hardens, a11y, Spotlight, RLS, auth matrices, owner-gated migrations.
- CHR-55: In Review. deviceAcceptance=not_recorded.
- Portfolio maturity ~8.4/10 (both warm, entropy down).

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Stranger occupant confirmed. Never gate on non-owned.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Review. Share path via Diagnostics ready. Highest remaining gate for QS ship.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing. Snapshot tests addressing Dynamic Type (#418).

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. undici / @hono/node-server patches pending (low-risk hygiene). Dependabot residual on gateway.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close pure noise if any remain. Merge green hardens with no file overlap after CI. One canonical roadmap.
**Innovate:** Enhanced entropy scoring (age + docs-only + Bolt/Jules flag + overlap - CI green). Interactive close forms for pure noise. Continuous probe refresh. Auto-report top close candidates. Direct main updates for docs hygiene. Cold-start timing in probes. Owner action queue for migrations/env. Prune historical AUDIT files >30d into archive/ and delete stale audit/* branches.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets. Low priority until entropy down.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens in flight. Privacy reason guards. URL userinfo redaction pending. RLS lock-down (#265) pending owner apply.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.

**Binding:** CHR-55 remains the production gate for Quicksilver. Entropy must prune further. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested. Owner must apply pending migrations and set env before certain merges (DB TLS, RLS, indexes). undici / hono patches low-risk hygiene.

**Highest-value next:** Prune entropy aggressively (close noise/drafts like #250/#120 after review, merge green non-overlapping hardens after CI review), clean stale audit branches, execute owner actions (apply SQL migrations #265/#208, configure env for TLS if merging, set githubAdapter if desired), then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is improving but still the current focus.

**Innovations proposed / implemented:**
1. Entropy scoring scripts already present in Conduit (entropy-score.mjs, entropy-dashboard.mjs, etc.) — rank by age, type, overlap, CI status → daily report of close candidates.
2. Probe script enhancements with cold-start timing and auto-recovery logging already in portfolio-probe.mjs (retries on 503).
3. Hygiene bot or manual queue for owner-gated items (migrations list, env checklist) — decision-queue.mjs exists.
4. Direct docs commits for living audits to reduce PR noise (this update and companion AUDIT).
5. Historical AUDIT consolidation + stale branch cleanup recommendation.
6. **New this pass:** Fresh 20:00Z audit committed directly to main; both planes confirmed warm; entropy reduced to 12; branch prune called out.

Date: 2026-11-12 ~20:00 UTC
