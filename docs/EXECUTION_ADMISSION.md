# Execution admission

Resonance execution admission is durable and project-scoped when Supabase is configured.

The admission boundary must preserve four outcomes:

- `accepted` — a new execution request owns the idempotency key and consumes one rate-limit slot.
- `replay` — the same idempotency key and request hash are retried; no new slot is consumed.
- `conflict` — an existing idempotency key is reused with a different request hash.
- `rate_limited` — the project has reached the configured admission window limit.

The database admission function serializes claims per project so concurrent requests cannot both observe available capacity and then exceed the limit.
