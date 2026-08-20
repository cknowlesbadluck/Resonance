# Resonance Agent Log

Append-only. Every agent session (chat or Code) must append an entry.

Format:

```
## YYYY-MM-DD HH:MM TZ — <agent / session identifier>

**Checked:**
- ...

**Decided:**
- ...

**Verified:**
- ...

**Next / Hand-off:**
- ...
```

---

## 2026-08-19 20:24 EDT — Grok (Lead Implementation)

**Checked:**
- Current CI workflow (`.github/workflows/ci.yml`) runs typecheck/test/build + Swift package tests on push and PRs to main.
- `main` is **not** branch-protected (`protected: false`). No required status checks.
- 8 open PRs (#2, #3, #6, #7, #9, #10, #13, #14).
- ~30 branches, many near-duplicates around `codex/event-lifecycle*`.
- Idempotency implementation: `Idempotency-Key` header is currently optional; if absent the request proceeds without claiming. DB unique index `(project_id, idempotency_key)` already exists.
- Linear project "Resonance Integration Platform" has CHR-24/25/26/27/33 active.

**Decided:**
- CI is the source of truth. Branch protection with required status checks on `main` is mandatory (tracked as Linear issue).
- Adopt server-canonical required `Idempotency-Key` (reject 400 if missing). Prefer the design already present in PR #9 style: required header + existing DB unique index. No silent fallback.
- Introduce append-only `docs/AGENT_LOG.md` as permanent session memory.
- Track open-PR count and approximate duplicate-branch count as a health metric in `docs/IMPLEMENTATION_STATUS.md`.
- Explicitly pre-authorize the following as **non-critical** under the Two-Key rule so agents do not stall: policy-deny logic changes, approval-resume endpoint, and the idempotency design choice (required header + unique index).
- Route governance and triage decisions into Linear; GitHub remains execution only.

**Verified:**
- Live tree and key files (ci.yml, executions/route.ts, idempotency.ts, migration, ARCHITECTURE, IMPLEMENTATION_STATUS) read from `main` @ ea18183.
- Linear team "Christopher Knowles" and Resonance project issues confirmed.

**Next / Hand-off:**
- Push this governance branch.
- Create Linear issues for branch-protection, agent-log process, and PR/branch health tracking.
- After merge: enable required status checks on `main` via GitHub settings (manual admin step until API support is wired).
