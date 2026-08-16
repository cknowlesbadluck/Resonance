# Resonance Implementation Status

## Completed in this implementation pass

### Nexus foundation
- Provider-neutral capability contracts remain the core boundary.
- Capability ranking now considers availability, risk, cost, and latency metadata.
- Execution plans support bounded retry policy.
- Executor retries failed adapter calls with linear backoff and preserves correlation IDs.
- Supabase persistence stores capability cost/latency telemetry.

### Persistence
- Resonance Supabase project is active.
- Nexus graph tables are present.
- Execution/capability telemetry migration has been applied.
- Existing RLS protections remain on Nexus graph tables.

### Native iOS foundation
- Swift 6 package foundation added under `ios/`.
- Actor-isolated `NexusClient` added.
- Async URLSession transport added.
- Initial SwiftUI application surface added.
- Client decoding test added before implementation.

## Explicit security hold

Supabase reports that `public.projects`, `public.providers`, and `public.project_members` currently have RLS disabled. The platform safety policy requires presenting the remediation SQL and obtaining a deliberate decision before changing those tables. The remediation is therefore **not auto-applied**.

Recommended SQL:

```sql
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
```

Enabling RLS without policies can block legitimate access, so policy design must accompany the change.

## Next engineering sequence

1. Complete real adapter registration and production bridge contracts.
2. Wire intent composition to persisted capabilities/resources/context.
3. Add durable execution state and idempotency semantics.
4. Add end-to-end lifecycle tests.
5. Build the native iOS feature flow on the stable Nexus API.
6. Run security, RLS, failure/retry, and provider-isolation hardening.
