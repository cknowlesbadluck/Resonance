# Portfolio 10-Phase Roadmap — 2026-11-07 13:02 UTC

Canonical. Companion audit: docs/AUDIT-2026-11-07-13Z-PORTFOLIO.md

**Live probe evidence (2026-11-07T13:02Z):**
- Conduit /ready: 200, v0.8.0, postgres, production true, contractRevision 2026-10-03-ready-surface.
- Resonance /api/ready: 200, missingRequired=[], posture=contract_passed, githubAdapterConfigured=false, timestamp 2026-11-07T13:01:57.831Z.
- Vercel: resonance.vercel.app 200 (stranger), resonancenexus.vercel.app 404.
- Open PRs: Resonance ~25, QuicksilverV1 17, Conduit 19. Entropy remains the operational killer.
- CHR-55: In Review Urgent, deviceAcceptance=not_recorded.

Brutal assessment: Stabilization holds when warm. Architecture solid. Not production-ready until device evidence and adapter configured. Hygiene debt is the highest lever.

## Phase 0 – Stabilize / Hygiene Prune
Close pure Bolt/Jules micro-opts (#349/#348/#334 Conduit, #254 Resonance) and superseded docs mirrors (#253/#413/#347/#338). Merge green non-overlapping hardens (Resonance early-401 #243-#246 + smoke #248 + log-safe #251; QS #409/#410/#411/#412; Conduit #335/#336).  
Exit: open PR < 15/repo; main green; status docs current.

## Phase 1 – Adapter Reality
Configure GITHUB_TOKEN + GITHUB_WEBHOOK_SECRET on Netlify resonancenexus. Prove durable github.repository.read.  
Exit: githubAdapterConfigured=true.

## Phase 2 – Device Gate
SideStore IPA on iPhone 16e. Record CHR-55 deviceAcceptance=passed.  
Exit: Linear Done + evidence artifact.

## Phase 3 – Durable Chamber
Persist chamber scenario in Supabase; control surface visibility.  
Exit: form/work/dissolve with audit intact.

## Phase 4 – Native Execution Loop
iOS peer compose → plan → execute → approve with Idempotency-Key.  
Exit: physical device completes loop.

## Phase 5 – Capability Convergence
Single NexusCapability model everywhere; retire client-only shapes.  
Exit: no dual models.

## Phase 6 – Multi-Adapter Substitution
Second real adapter (Linear or Supabase) behind same contract.  
Exit: provider swap without Chamber change.

## Phase 7 – Observability Innovate
Continuous entropy + probe dashboard (script + optional Linear issue). Score PRs by age/CI/overlap/docs-only.  
Exit: daily green report; trend visible.

## Phase 8 – Release Smoke Automation
Fail-closed production smoke as CI against live host.  
Exit: smoke green.

## Phase 9 – Post-Deploy Hardening
Rate-limit tuning, log redaction complete, Privacy Manifest final, branch protection tight.  
Exit: security review pass.

## Phase 10 – Public Release Surface
SideStore/IPA evidence public, docs current, finished-vision signals 1-6 hold.  
Exit: production verdict.

Highest-value next: Phase 0 prune (close noise, merge green non-overlapping), then Phase 1 adapter config, then Phase 2 device evidence. Do not open new feature branches until entropy drops. No secrets. No invented device claims.
