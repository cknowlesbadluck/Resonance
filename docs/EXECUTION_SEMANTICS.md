# Execution semantics

## Retry inside one step

`NexusExecutor` retries a single step only while that step has not returned `ok`. The attempt limit and backoff come from the plan (`retry.maxAttempts`, `retry.backoffMs`). A later attempt does not run after a successful adapter result.

## Parallel waves

Steps in the same wave have no unmet `dependsOn` edge. The wave uses `Promise.all`, so one step cannot cancel a sibling that has already started. Adapter side effects that already succeeded are not rolled back.

## Fair share (no party dominates)

Each adapter invocation holds two slots, in a fixed order: a **per-project** slot (`RESONANCE_MAX_INFLIGHT_PER_PROJECT`, default 4, max 64), then a **per-adapter** slot (`RESONANCE_MAX_CONCURRENT_PER_ADAPTER`, default 8, max 128). A wide wave from one project therefore runs at most 4 steps at once, and other projects' steps interleave on the same adapter. They queue FIFO instead of being starved. Each wait queue is bounded at 256 per key. Past that, the step fails fast with `fair_share_queue_full` and the execution reports `partial` or `failed` under the usual rules. Bad values (blank, non-numeric, zero, negative) fall back to the default, so the guard can't be disabled by a typo. The guard is per server instance (in memory), like rate limits and idempotency. See `src/nexus/fair-share.ts`.

### Shared leases (cross-instance, opt-in)

Set `RESONANCE_SHARED_LEASES=supabase`, apply `supabase/migrations/20261017090000_nexus_shared_leases.sql` (**owner applies**), and keep `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` configured. The same per-project and per-adapter caps then hold **across instances**. Each step takes its local slots first, then a shared project lease, then a shared adapter lease. Leases are rows in `nexus_fair_share_leases`, admitted by `nexus_lease_acquire()` under a per-slot advisory lock. Every lease carries a TTL (`RESONANCE_SHARED_LEASE_TTL_SECONDS`, default 120), so a crashed instance's slots expire on their own. Fail-safe behaviour:

- If Supabase errors or does not answer within 1.5 s, steps fall back to the local limits for a 30 s cooldown.
- If the migration is not applied yet (missing function), steps use local limits and the store re-checks every 10 minutes.
- If a slot is full cluster-wide, the step retries with backoff for at most `RESONANCE_SHARED_LEASE_MAX_WAIT_MS` (default 5000). It then fails fast with `fair_share_shared_busy` (retryable). It never waits indefinitely.
- Release is best-effort; the TTL covers a failed release.

`SharedLeaseStore.tryConsume()` gives the same table a shared rate-limit primitive (`scope = 'rate'`, never released, TTL = window), ready for the API rate limiter (#175). See `src/nexus/shared-lease.ts`.

## Partial failure

If any step in the execution has succeeded and another step then fails, the execution status is `partial`, not `failed`.

- `failed` means no step succeeded.
- `partial` means at least one step succeeded and at least one failed or could not be scheduled.
- `stepOutcomes` lists each finished step. `stepsSafeToRetry(plan, stepOutcomes)` returns every step that did not succeed.
- Evidence for both the successful and failed steps is kept.
- HTTP status for a partial execution is `207`. A total failure remains `422`.

Do not submit the original plan again after `partial`. That would repeat succeeded side effects. Build the next plan from `stepsSafeToRetry`.

## Idempotency

`POST /api/nexus/executions` requires `Idempotency-Key`. The same project and key with the same request hash replays the recorded response. A different hash is `409`. A claim left in `accepted` can be taken over only after five minutes, and only one caller wins that takeover.

Production does not keep this state in process memory. If Supabase or `RESONANCE_AUTH_MODE=required` is missing, user-data routes return `503`.

## Webhooks

GitHub webhook deliveries are acknowledged only after the signature matches the raw body, the payload is at most 1 MiB, a delivery id is present, and the event row is inserted. A unique violation on `(project_id, source, external_id)` is a duplicate acknowledgement and does not insert a second row.
