# Portfolio 10-Phase Roadmap — Refreshed 2026-11-13 14:04 UTC

Canonical cross-plane roadmap for QuicksilverV1 + Resonance + Conduit. Living document. Update with evidence. Direct main commit for hygiene.

**Current posture (2026-11-13 14:04Z):** Both backends warm/ready (Conduit 0.8.0 postgres, Resonance contract_passed auth required). Entropy 7 open PRs (target <10). Device acceptance not_recorded. Scores ~8.7. Hygiene holds. Innovation: continuous audit + probe + direct docs + Owner Action Queue + Device Evidence Stub.

| # | Phase | Goal | Concrete Tasks | Exit Criteria | Status |
|---|---|---|---|---|---|
| 1 | Entropy control | Open PRs <10 total, none stale >14d | Merge green non-overlapping hardens (auth matrix, RLS, a11y, release gate). Close pure noise drafts. | ≤10 open across portfolio; weekly entropy report green | [in progress] held at 7 |
| 2 | Device evidence | CHR-55 recorded on real iPhone 16e / iOS 27 | Owner records IPA install + basic surface validation via Diagnostics export (content-free). See Conduit/docs/DEVICE-EVIDENCE-STUB.md. | deviceAcceptance=recorded; SideStore path verified | [blocked] owner |
| 3 | Auth hardening complete | Fail-closed everywhere in prod | Merge remaining auth PRs; confirm production authMode=required with no bypass. Apply #265 RLS after owner review. | Auth matrix tests on main; no raw error leaks; live RLS locked | [in progress] |
| 4 | Contract stability | Versioned MCP + /ready surfaces | Land contract discovery + changelog gate. Pin SHAs on remaining Actions. | CI fails on undocumented tool/field change | [in progress] |
| 5 | Observability | Cold-start-aware probes, zero false alarms | Extend portfolio-probe with retry timing; entropy dashboard. Owner Action Queue surface. | Probe reports distinguish startup from outage | [in progress] |
| 6 | Hygiene automation | Weekly self-report replaces manual audits | Schedule entropy + archive prune + stale-branch reports. Living audits on main. | Manual full audits drop to bi-weekly | [partial this pass] |
| 7 | Adapter readiness | githubAdapter live when desired | Owner configures GITHUB_TOKEN + webhook secret on host. | github.repository.read succeeds inside chamber | [blocked] owner |
| 8 | Performance baseline | Measured hot paths | Benchmark capability matching, pagination, probe latency. Apply #208 indexes after review. | p95 documented; no premature opts | not started |
| 9 | 1.0 contract | Stable semver + deprecation policy | Freeze contractRevision; publish runbook (cold start, rollback, key rotation). | 30 consecutive green main days; ≤5 open PRs | not started |
| 10 | Production claim | Honest ship | Device evidence + all phases 1-7 green. | Owner declares production-ready; free-tier constraints documented | not started |

## High-leverage innovations
- Dated audit automation on main (this pass at 14:04Z).
- Owner Action Queue and Device Evidence Stub (implemented this pass on Conduit).
- Entropy auto-rank close candidates (existing scripts; schedule next).
- Cold-start classifier already partially present; complete timing capture.
- Portfolio probe already in CI; extend for continuous dashboard.
- Direct main docs commits to prune PR noise.

## Top risks
1. Device evidence remains the only path to honest Quicksilver production claim.
2. Residual entropy distracts from device gate.
3. Free-tier cold starts require probe retry discipline.
4. Unapplied RLS/indexes leave residual surface until owner acts.

Highest-value next action: Owner reviews and applies #265 RLS then #208 indexes. Concurrently review #416. Then record CHR-55 on physical device. Entropy reduction continues.
