# Resonance Development Guidelines

Strict rules for humans and agents. Violations block merge.

## 1. Product boundaries

1. Provider-neutral. Provider logic stays in adapters.
2. Quicksilver is **out of scope**.
3. Domain independence: core abstractions must make sense without Quicksilver.
4. Native iOS and web are **clients** of the Nexus API.

## 2. Source of truth

| Concern | Source |
|---------|--------|
| Merge readiness | CI `web` + `ios` |
| Backlog | Linear |
| Code | GitHub `main` |
| Session memory | `docs/AGENT_LOG.md` |
| Phase status | `docs/IMPLEMENTATION_STATUS.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Roadmap | `docs/ROADMAP.md` |

## 3. GitHub workflow

1. Feature branch → PR → green checks → squash merge.
2. Rising open-PR or duplicate-branch count → stop building, consolidate.
3. No force-push past required checks.
4. No merge that reintroduces optional Idempotency-Key or drops auth.

## 4. API contracts

1. Executions require non-blank `Idempotency-Key` (400 if missing).
2. Same key + different hash → 409; same hash → replay.
3. `RESONANCE_AUTH_MODE`: `required` | `optional` | `auto`.
4. Bound payloads. Never expose service-role keys to clients.

## 5. Domain model

1. Prefer `NexusCapability` / Nexus types over parallel catalogs.
2. Capability plane must converge (CHR-33 / ROADMAP P2).
3. Policy gate is unbypassable.

## 6. Native iOS

1. Always send `Idempotency-Key` on execute.
2. Bearer + project scope when deployed.
3. Structured concurrency; explicit HTTP error mapping.
4. No service-role secrets in the client.

## 7. Two-Key

Critical changes need dual Christopher approval.
Pre-authorized non-critical: idempotency design, policy-deny refinements, approval-resume.

## 8. Agents

Append AGENT_LOG every session. Linear for decisions. CI is the only merge authority.
