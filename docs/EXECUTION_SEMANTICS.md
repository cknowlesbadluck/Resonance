# Execution semantics

## Retry inside one step

`NexusExecutor` retries a single step only while that step has not returned `ok`. The attempt limit and backoff come from the plan (`retry.maxAttempts`, `retry.backoffMs`). A later attempt does not run after a successful adapter result.

## Parallel waves

Steps in the same wave have no unmet `dependsOn` edge. The wave uses `Promise.all`, so one step cannot cancel a sibling that has already started. Adapter side effects that already succeeded are not rolled back.

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
