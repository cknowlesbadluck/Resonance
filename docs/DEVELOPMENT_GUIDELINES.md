# Resonance Development Guidelines

Strict rules for humans and agents. Violations block merge.

## 1. Product boundaries

1. Resonance is provider-neutral. Provider logic stays in adapters.
2. Quicksilver is **out of scope**. Do not import its architecture, naming, or modules into Resonance core.
3. Domain independence test: *Would this core abstraction still make sense if Quicksilver did not exist?* If no, move it out of core.
4. Native iOS and web are **clients** of the Nexus API, not alternate cores.

## 2. Source of truth

| Concern | Source |
|---------|--------|
| Merge readiness | Observed CI (`web`, `ios`) |
| Backlog / triage | Linear (Resonance Integration Platform) |
| Code | GitHub `main` |
| Session memory | `docs/AGENT_LOG.md` (append-only) |
| Phase status | `docs/IMPLEMENTATION_STATUS.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Roadmap | `docs/ROADMAP.md` |

Commit messages are not evidence of correctness.

## 3. GitHub workflow

1. Work on a feature branch; open a PR to `main`.
2. Require green `web` + `ios` before merge.
3. Prefer squash merge for focused PRs.
4. If open-PR count or duplicate-branch count trends up, **stop building and consolidate**.
5. Do not force-push past required checks.
6. Do not merge stale PRs that reintroduce optional Idempotency-Key or drop auth.

## 4. API contracts

1. `POST /api/nexus/executions` **requires** non-blank `Idempotency-Key` → 400 if missing.
2. Same key + different body hash → 409.
3. Same key + same hash → idempotent replay (`X-Idempotent-Replay`).
4. When Supabase is configured, require Bearer auth + project membership for protected routes.
5. Bound payloads (size, objective length, requirements count).
6. Never expose service-role keys to clients.

## 5. Domain model rules

1. Prefer extending `NexusCapability` / Nexus types over creating parallel catalogs.
2. Capability plane (skills/tools/integrations) must converge on Nexus contracts (CHR-33).
3. Chambers are temporary execution spaces; durable truth is events, evidence, audit, artifacts.
4. Policy gate is unbypassable; connection ≠ authority.

## 6. Native iOS rules

1. Every execution request sends `Idempotency-Key` (caller-supplied or generated UUID).
2. Deployed environments send `Authorization: Bearer <token>` and project scope.
3. Use actors / structured concurrency; avoid unstructured tasks.
4. Map HTTP 400/401/409/422 explicitly in the client.
5. No secrets in the app binary or UserDefaults for service-role material.

## 7. Two-Key Reformation Rule

Critical changes need two explicit approvals from Christopher.

**Critical:** core identity, domain semantics, fundamental architecture, source-of-truth hierarchy, irreversible migrations, major subsystem deletion/replacement, major vendor lock-in.

**Pre-authorized non-critical** (do not stall):
- Idempotency design (required header + unique index)
- Policy-deny refinements that do not expand authority
- Approval-resume endpoints

## 8. Agent obligations

1. Append `docs/AGENT_LOG.md` every session.
2. Update Linear when decisions change scope.
3. Update `IMPLEMENTATION_STATUS.md` health metrics when PR/branch counts change materially.
4. Load `masterdev` for end-to-end Resonance work; load specialized skills for depth.
5. CI green is the only merge authority agents may claim.

## 9. Code review bar

- Correctness against Nexus contracts
- Tests for new behavior, especially failure paths
- No Quicksilver leakage
- No unexplained parallel domain models
- Security: authz, bounds, secret handling
- CI green

## 10. Hygiene

- Delete or close superseded branches/PRs promptly.
- One concern per PR when possible.
- Migrations must be additive and reversible where feasible.
- Demo adapters are allowed only behind explicit non-production paths.
