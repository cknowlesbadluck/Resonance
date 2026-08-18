# Resonance Execution Checklist

Updated: 2026-08-18

This is the active release checklist for the six-phase sprint. A checkbox is marked complete only after repository or runtime evidence exists.

## Phase 1 — Core
- [x] Provider-neutral Nexus contracts
- [x] Capability discovery/composition/execution path
- [x] Correlation IDs
- [x] Bounded retry behavior
- [ ] Full lifecycle registration → evidence test
- [ ] Durable execution semantics

## Phase 2 — Web
- [x] Spatial Nexus surface
- [x] Real execution endpoint
- [ ] Complete loading/empty/error states across all primary views
- [ ] Verify every actionable UI element against live behavior

## Phase 3 — Backend/Data
- [x] Resonance Supabase project active
- [x] Nexus graph persistence
- [x] Execution/evidence persistence
- [x] RLS enabled on Nexus graph tables
- [ ] Idempotency key persistence
- [ ] Durable execution transitions
- [ ] Complete policy coverage for projects/providers/project_members

## Phase 4 — Integrations
- [x] Provider-neutral adapter boundary
- [x] HTTP/MCP adapter path
- [ ] Production bridge credentials/endpoints
- [ ] Webhook signature verification
- [ ] Webhook deduplication
- [ ] Provider isolation tests

## Phase 5 — Hardening
- [x] Web CI typecheck/test/build configured
- [x] Swift package test configured
- [ ] Verified green CI run on latest implementation
- [ ] Failure/idempotency test matrix
- [ ] Secret exposure audit
- [ ] Dependency/security audit

## Phase 6 — iOS
- [x] Swift 6 package foundation
- [x] Live capability discovery
- [x] Spatial native presentation
- [ ] Native invocation flow
- [ ] Native result/evidence flow
- [ ] Native failure/retry states
- [ ] Side-store release verification

## Edge
- [ ] Evaluate Cloudflare only after lifecycle/idempotency gates
- [ ] Add smallest useful edge/security boundary if justified
- [ ] Do not migrate Supabase or the core Nexus to Cloudflare

## Final gate
- [ ] Intent → discovery → matching → policy → execution → adapter → evidence → persistence → web/native verified end-to-end
- [ ] Automated verification green
- [ ] No critical security findings
