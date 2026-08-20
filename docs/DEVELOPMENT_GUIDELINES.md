# Resonance Development Guidelines

Strict rules for humans and agents. Violations block merge.

## Product boundaries

1. Provider-neutral. Provider logic stays in adapters.
2. Quicksilver is out of scope.
3. iOS and web are clients of the Nexus API.

## Source of truth

| Concern | Source |
|---------|--------|
| Merge readiness | CI `web` + `ios` |
| Backlog | Linear |
| Code | `main` |
| Session memory | `docs/AGENT_LOG.md` |
| Roadmap / vision | `docs/ROADMAP.md`, `docs/PRODUCT_VISION.md` |

## API contracts

1. Executions require non-blank `Idempotency-Key`.
2. `RESONANCE_AUTH_MODE`: required | optional | auto.
3. Capability API returns **NexusCapability** shapes.
4. Never expose service-role keys to clients.

## Domain model

Prefer extending `NexusCapability` over parallel catalogs. Bridge interim catalog data until cut-over.

## Agents

Append AGENT_LOG every session. CI is the only merge authority.
