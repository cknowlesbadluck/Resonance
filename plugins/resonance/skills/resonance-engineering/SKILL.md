---
name: resonance-engineering
description: Use when auditing, implementing, testing, hardening, or releasing the Resonance Nexus repository. Preserve provider neutrality, least privilege, durable evidence, and the separation between Resonance core and external integrations.
---

# Resonance Engineering

Operate on the Resonance repository as an engineering system, not as a generic Next.js application.

## Mission

Maintain Resonance as a provider-neutral Nexus that composes capabilities, context, policy, execution, and evidence across external ecosystems. Do not make Quicksilver, GitHub, Supabase, OpenAI, MCP, or any other provider a core-domain dependency merely because it is currently useful.

## First pass

1. Read `README.md`, `docs/ARCHITECTURE.md`, `docs/NEXUS_PROOF.md`, `docs/ROADMAP.md`, and the relevant Superpowers design/plan documents before changing architecture.
2. Inspect `package.json`, CI, migrations, API routes, `src/nexus/`, and existing tests.
3. Search for repository instructions (`AGENTS.md`, plugin manifests, skills, and local configuration) before editing.
4. Establish the current git branch and diff. Never discard unrelated user work.
5. Identify the smallest safe change that closes the requested gap.

## Engineering rules

- Keep Nexus domain contracts provider-neutral.
- Treat adapters as the boundary for GitHub, MCP, HTTP, Supabase, OpenAI, Linear, Figma, and other external systems.
- Enforce authentication, authorization, least privilege, validation, rate limiting, idempotency, and auditability at external boundaries.
- Never expose service-role keys, provider secrets, or private context to clients or plugin metadata.
- Never treat in-memory state as durable production state. Persistence must be explicit and failure-safe.
- Preserve approval gates for high-risk execution. Do not silently downgrade policy decisions.
- Prefer additive, reversible migrations and changes.
- Keep iOS as a control surface; do not duplicate Nexus intelligence in the client.
- Keep plugin packaging independent from the runtime deployment boundary unless a verified MCP server is intentionally included.

## API and security review

For every route or integration change, check:

- request schema validation and bounded input sizes
- authentication and authorization
- secret handling and server/client boundaries
- replay and duplicate-event handling
- predictable error responses without secret leakage
- timeout and retry behavior
- rate limiting where externally reachable
- audit/evidence emission for state-changing operations
- persistence semantics across process restarts

Webhook handlers must verify signatures before parsing or acting on payloads. Event ingestion should be idempotent on provider delivery identifiers when the provider supplies one.

## Testing gate

Run the repository-native checks that apply:

```text
npm run typecheck
npm test
npm run build
```

When changing a behavior, add or update a focused regression test before declaring the work complete. For release work, also validate the plugin manifest, skill structure, archive contents, and deterministic packaging using the repository's available plugin tooling.

## Plugin boundary

The Resonance plugin is currently skills-only unless a real, authenticated, production MCP server is explicitly wired into the package. Do not invent an MCP endpoint or publish fixture adapters as if they were production services.

The plugin skill should help Codex and ChatGPT work on a Resonance checkout. It must not claim that installing the skill grants access to private GitHub, Supabase, Linear, or other accounts.

## Release gate

Before a plugin release:

1. Verify current official OpenAI plugin rules.
2. Validate `.codex-plugin/plugin.json` and every bundled Skill.
3. Confirm public metadata accurately describes behavior and does not overclaim integrations.
4. Confirm no secrets, private URLs, generated credentials, or development-only files are packaged.
5. Build the package twice and require identical SHA-256 hashes.
6. Inspect the archive root and file list.
7. Test installation on every surface actually available; never claim a surface was tested when it was not.
8. Record commit, version, validation evidence, and any remaining limitation.

## Change discipline

If a requested change would alter core identity, domain semantics, fundamental architecture, source-of-truth hierarchy, irreversible migrations, major subsystem deletion/replacement, or major vendor lock-in, stop and surface the change as a critical reformation requiring the repository's explicit two-key governance process.

Normal bug fixes, tests, documentation, security hardening, and additive implementation can proceed directly.
