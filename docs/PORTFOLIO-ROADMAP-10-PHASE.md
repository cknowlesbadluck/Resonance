# Portfolio 10-phase roadmap — 2026-09-30 08:00 EDT

1. **Stabilize entropy** — merge or close open PRs. #135 honest-invoke + skill plane is on main (`5ba7ca82`). Close stale hygiene stamps. Exit: open PRs only for live work.
2. **Owner SERVICE_ROLE** on Netlify `resonancenexus` only. Exit: `GET /api/ready` 200. Confirmed 503 this session. Do not invent the secret. Do not switch hosts.
3. **Land Resonance hardening already written** — rebase/merge #133 (fail-closed auth, webhook cap, Next 16) and #131 (bounded GitHub reads) after green `web`+`ios`. Keep #134 as the iOS app-target slice.
4. **Durable GitHub vertical slice on the live host** — `GITHUB_TOKEN` + `GITHUB_WEBHOOK_SECRET` + post-restart evidence for `github.repository.read` including deny proofs.
5. **Quicksilver device HG CHR-55** on iPhone 16e from `4f9660ff` or later. Simulator CI is not acceptance. #195 stays red until Simulator Build + SPM tests pass.
6. **Quicksilver next code slice after HG** — finish #193 (supersedes closed #191) or repair #195. Next product slice is CHR-12 a11y or conversation retrieval. P-T4 stays behind M3.5-T4.
7. **Conduit freeze + selected harden** — #156 eviction sweep is on main (`cefebc6f`). Live health/ready 200 postgres 0.8.0. Do not merge #119/#120 red drafts. Do not merge #155 until Render TLS env is set. Rebase #152 path-guard.
8. **Resonance iOS I1** against a ready host: compose → plan → approve → execute → evidence. Blocked by phase 2.
9. **Chamber form / work / dissolve** with retained project-scoped audit in Supabase, visible on web and iOS. Blocked by phase 2.
10. **Release surface** — SideStore IPA evidence, unskip production-smoke, owner prune leftover `docs/hygiene-*`, `codex/*`, `bolt/*`, `develop`, `feature/ios-p4-compose-execute-evidence`, `release/0.8.0`. Archive abandoned `cknowlesbadluck/Quicksilver`. `mcp` is already archived. No delete-ref tool on this connector.
