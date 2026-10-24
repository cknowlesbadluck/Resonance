# Portfolio 10-phase roadmap — refreshed 2026-10-24 11:00Z (07:00 ET)

Prioritized by leverage. Status: [passed] exit criteria met with live evidence; [in progress]; [blocked] needs owner.
Evidence: docs/AUDIT-2026-10-24.md (11:00Z section).

| # | Phase | Exit criteria | Status |
|---|-------|---------------|--------|
| 1 | Close the Dependabot gap | Resonance #233 (next 15.5.28 + vitest 4.1.12) merged; open Dependabot alerts = 0 in all 3 repos | [blocked] owner review of #233 (4 alerts open; branch updated to main 11:03Z) |
| 2 | Main-branch protection | No direct pushes to main (cc0b7df at 06:01Z was a direct push via owner token); required checks + PR-only on main in all repos | [blocked] owner must enable branch protection / ruleset |
| 3 | PR entropy below 25 per repo | Open PRs: Conduit ≤25 (26), Resonance ≤25 (45), QS ≤25 (18); hygiene target <10 | [in progress] |
| 4 | Branch prune with proof | stale-branch report marks safe-delete only on PR done + (aheadBy 0 or contentInMain); Conduit #298 | [in progress] 8 Conduit candidates, 0 Resonance, 0 QS |
| 5 | Ready/contract consistency | Conduit /ready 200, Resonance /api/ready 200, unauth /api/nexus/executions 401, --consistency true | [passed] 11:02Z |
| 6 | Vercel alias drift resolved | 4 Vercel aliases no longer stranger/absent, or removed from the probe as decommissioned | [blocked] owner decision |
| 7 | Dependency freshness (patch/minor) | npm outdated shows no patch/minor gaps; majors tracked | [in progress] Conduit #299 |
| 8 | Test depth | Coverage gates hold; every script has a test file; Resonance route-level 401/403 tests on all nexus routes | [in progress] |
| 9 | Cold-start / perf | Conduit /ready < 3 s p95 (08:01Z was 22.3 s on Render free-tier cold start) | [blocked] free-tier plan |
| 10 | Cross-plane acceptance proof | Portfolio maturity score ≥ 8/10 (now 4/10) for 7 consecutive days | [in progress] |

## Innovation track
- [in progress] Squash-aware safe-delete (Conduit #298): GET-only blob-SHA comparison against main.
- [passed] Conservative aheadBy safe-delete (Conduit #295).
- Next: weekly read-only prune report as a workflow artifact; owner approves deletions.
