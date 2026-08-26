# Resonance — Floot Exit Plan

## Objective

Remove Floot from the critical development and deployment path without losing the working architecture already established.

## Stage 0 — Preserve

- Keep Floot project intact as a temporary recovery source.
- Preserve the `Agent runtime and workflow execution` checkpoint.
- Keep the live deployment available until the independent deployment is verified.
- Keep the architecture and salvage record in GitHub.

## Stage 1 — Canonical repository

Repository: `cknowlesbadluck/Resonance`

Required canonical areas:

```text
app/                 Next.js/web control plane
lib/
  domain/            provider-neutral domain contracts
  integrations/      connector manifests/installations
  capabilities/      capability registry + policy
  agents/            agent runtime
  workflows/         workflow graph/runtime
  mcp/               MCP lifecycle
  providers/         provider adapters
  events/            event contracts/bus
  artifacts/         artifact storage contracts
docs/
supabase/            schema + migrations
```

## Stage 2 — Reconstruct Floot runtime

Recreate these contracts from the Floot checkpoint:

- integration catalog
- integration installations
- capabilities
- agents
- agent runs
- workflow definitions
- workflow steps
- workflow runs
- run events
- approvals
- project membership enforcement
- authenticated APIs

Use normal repository modules; do not carry Floot-specific helper dependencies into the architecture.

## Stage 3 — Provider adapters

Implement a shared adapter contract:

```ts
interface ProviderAdapter {
  provider: string;
  capabilities(): CapabilityManifest[];
  health(): Promise<HealthResult>;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}
```

Initial adapters:

- GitHub
- Supabase
- Linear
- Figma
- OpenAI
- MCP

Adapters must be mockable and must never bypass policy.

## Stage 4 — Runtime

Implement:

- workflow graph validation
- topological/parallel execution
- conditions
- retries
- timeout/cancellation
- idempotency
- approval pauses
- compensation hooks
- event emission
- artifact registration

## Stage 5 — MCP

Implement lifecycle:

`discover -> register -> authenticate -> discover tools -> grant scopes -> execute -> health -> revoke`

## Stage 6 — Agent system

Agents need:

- model/provider
- system policy
- skills
- connectors
- capabilities
- context
- limits
- approval policy
- lifecycle
- run history

## Stage 7 — iOS

Build a native SwiftUI client that consumes the API. Prioritize:

1. authentication
2. dashboard
3. projects
4. agents
5. workflows
6. live runs
7. approvals
8. integrations
9. artifacts
10. settings/diagnostics

The iOS app is a control Nexus, not a replacement for the backend runtime.

## Stage 8 — Verification

Required gates:

- TypeScript/build clean
- unit tests
- integration tests with mocked providers
- authorization tests
- idempotency tests
- workflow failure/retry tests
- MCP permission tests
- iOS build/tests when Xcode environment is available
- security review
- dependency audit
- production smoke tests

## Stage 9 — Free deployment

Maintain a $0 development constraint. Prefer GitHub Actions and free-tier/self-hosted services. Do not make paid Apple Developer membership a requirement for development or local/simulator validation.

## Exit criterion

Floot can be disabled/abandoned only after:

- repository implementation is complete enough to run independently,
- database migrations are reproducible,
- tests pass,
- deployment succeeds independently,
- API smoke tests pass,
- and the live independent deployment is verified.
