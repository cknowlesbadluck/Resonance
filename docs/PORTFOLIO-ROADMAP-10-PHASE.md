# Portfolio 10-phase roadmap — 2026-09-25 17:00 EDT

Owner-blocked items stay owner-blocked. Agents do not invent Netlify secrets or claim device HG.

1. **Ready-or-refuse on main** — DONE (#108). Live still 503 until SERVICE_ROLE is set.
2. **Owner: set resonancenexus env** — `SUPABASE_SERVICE_ROLE_KEY` on the existing site only. Exit: `GET /api/ready` 200. Binding constraint. Highest-leverage move in the portfolio.
3. **Prove durable GitHub vertical slice** — authenticated member executes `github.repository.read` once; execution + event + evidence survive restart; other project and anonymous caller cannot.
4. **Device HG CHR-55** — Archive + SideStore smoke on a physical iPhone. GitHub Actions simulator success is not acceptance.
5. **Quicksilver post-HG code slice** — CHR-12 realm a11y / reduced-motion, or first on-device bound AI turn. Optional: land #152 Sentry errors/hangs-only if CI stays green.
6. **Conduit freeze + repair red drafts** — keep #119/#120 draft until verify+postgres green on current main; do not land schema-at-runtime removal until migrate runner is production-wired.
7. **Conduit #125 keyset pagination** — required GitHub jobs already green. Merge after rebase if mergeable_state is clean. Ignore Cloudflare Workers Builds unless production leaves Render.
8. **Resonance iOS I1** — compose → plan → approve → execute → evidence against a ready host. Blocked by phase 2.
9. **Chamber lifecycle slice** — form / work / dissolve with audit intact. Not before durable evidence works.
10. **Release surface** — SideStore/IPA evidence, Privacy Manifest, production-smoke unskipped, branch entropy down to main + one active feature branch per repo. Connector cannot delete refs; owner prune required.
