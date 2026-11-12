# Portfolio 10-phase roadmap — refreshed 2026-11-12 ~00:02 UTC (full audit + harden + stabilize + hygiene prune + innovate)

**Canonical source:** This file. Companion full audit: docs/AUDIT-2026-11-12-0002Z.md

**Live probe evidence (2026-11-12 ~00:02Z):**

- Conduit https://conduit-feco.onrender.com/ready : **HTTP 503** (free-tier cold start). Recoverable; prior 23:02Z was 200 warm (0.8.0, postgres, production true, contractRevision 2026-10-03-ready-surface).
- Resonance https://resonancenexus.netlify.app/api/ready : **ready OK** (missingRequired=[], production true, githubAdapterConfigured=false, posture=contract_passed, timestamp ~2026-11-12T00:01Z). Owner gate cleared.
- Open PR entropy: QuicksilverV1 **2**, Resonance **9**, Conduit **7**. Total **18**. Down from ~38. Target <10. Remaining primarily hardens, hygiene scripts, owner-gated migrations, auth matrices, redaction.
- CHR-55: In Review. deviceAcceptance=not_recorded.
- Portfolio maturity ~7.8/10 this pass (Conduit cold); ~8.2/10 when both warm.

## Phase 1 — Owner gate cleared
Exit met. missingRequired=[] , posture contract_passed on Resonance Netlify. Conduit ready when warm.

## Phase 2 — Alias and stranger classification strict
Tests reject non-owned as ready. Clean Vercel aliases (non-blocking). Stranger occupant confirmed. Never gate on non-owned.

## Phase 3 — Device fence immutable
claimDeviceAcceptance rejects. deviceAcceptance stays not_recorded until owner records real IPA.

## Phase 4 — CHR-55 sole device gate
Archive IPA on target iPhone 16e / iOS 27 only. Simulator/CI insufficient. Linear CHR-55 In Review. Share path via Diagnostics ready. Highest remaining gate for QS ship.

## Phase 5 — Memory and conversation budgets
Bounded, on-device first. AppTests green. Resilience tests progressing. Snapshot tests addressing Dynamic Type.

## Phase 6 — Gateway free-tier contract
No paid bindings. Cold-start recoverable. Free-only AI path. undici / @hono/node-server patches pending (low-risk hygiene). Dependabot residual on gateway.

## Phase 7 — Hygiene prune
Target open PRs <10/repo. Close pure noise if any remain. Merge green hardens with no file overlap after CI. One canonical roadmap.
**Innovate:** Enhanced entropy scoring (age + docs-only + Bolt/Jules flag + overlap - CI green). Interactive close forms for pure noise. Continuous probe refresh. Auto-report top close candidates. Direct main updates for docs hygiene. Cold-start timing in probes. Owner action queue for migrations/env.

## Phase 8 — Resonance adapters
Configure githubAdapter (GITHUB_TOKEN + webhook secret) on Netlify. githubAdapterConfigured remains false until owner sets. Low priority until entropy down.

## Phase 9 — Privacy and logging strict
Manifest enforced. No body logging. Redact errors and credentials. Early-401 hardens in flight. Privacy reason guards. URL userinfo redaction pending.

## Phase 10 — Cross-plane acceptance
Probe + device evidence + low entropy. Production verdict only after all gates. Unified acceptance harness that never invents owner evidence.

**Binding:** CHR-55 remains the production gate for Quicksilver. Entropy must prune further. Free-tier cold starts OK if recoverable. No auto-merge of overlapping or untested. Owner must apply pending migrations and set env before certain merges (DB TLS, RLS, indexes). undici / hono patches low-risk hygiene.

**Highest-value next:** Prune entropy aggressively (close noise, review/merge green non-overlapping hardens), execute owner actions (apply SQL migrations, configure env for TLS if merging, set githubAdapter if desired), patch Dependabot, then record CHR-55 device IPA on real iPhone. Stabilization holds. Innovate under constraints. Do not invent owner evidence. Entropy is improving but still the current focus.

**Innovations proposed / implemented:**
1. Entropy scoring scripts already present in Conduit (entropy-score.mjs, entropy-dashboard.mjs, etc.) — rank by age, type, overlap, CI status → daily report of close candidates.
2. Probe script enhancements with cold-start timing and auto-recovery logging already in portfolio-probe.mjs (retries on 503).
3. Hygiene bot or manual queue for owner-gated items (migrations list, env checklist) — decision-queue.mjs exists.
4. Direct docs commits for living audits to reduce PR noise (this update).

Date: 2026-11-12 ~00:02 UTC
