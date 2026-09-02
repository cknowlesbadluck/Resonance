## 2026-08-31 - Agent Jules - Fix CHR-51
- **Intent**: Fix resume route concurrency issue where claimed execution requests had no lease/recovery. Implement Option A (executing status transition).
- **What changed**:
  - Created `supabase/migrations/20260831000000_execution_request_executing.sql` and `20260831000001_validate_execution_request_executing.sql` to add 'executing' to the status check constraint safely.
  - Updated `app/api/nexus/executions/[id]/resume/route.ts` to use `executing` in the CAS query when claiming a `waiting` or `accepted` request.
  - Updated `app/api/nexus/executions/route.ts` to transition `accepted` requests to `executing` right before running `NexusExecutor.execute()`.
  - Added a concurrency CAS simulation test to `src/nexus/executions.route.test.ts`.
- **Verified locally**: `npm run typecheck` and `npm test` successfully passed.
- **Pending verification**: None.
- **Not fixed / out of scope**: Option B (Lease columns) was not implemented per issue direction (Option A was preferred).
- **Two-Key check**: Not applicable; bug fix and additive status change.

## 2026-08-31 - Agent Jules - Fix CHR-51
- **Intent**: Fix resume route concurrency issue where claimed execution requests had no lease/recovery. Implement Option A (executing status transition).
- **What changed**:
  - Created `supabase/migrations/20260831000000_execution_request_executing.sql` and `20260831000001_validate_execution_request_executing.sql` to add 'executing' to the status check constraint safely.
  - Updated `app/api/nexus/executions/[id]/resume/route.ts` to use `executing` in the CAS query when claiming a `waiting` or `accepted` request.
  - Updated `app/api/nexus/executions/route.ts` to transition `accepted` requests to `executing` right before running `NexusExecutor.execute()`.
  - Added a concurrency CAS simulation test to `src/nexus/executions.route.test.ts`.
- **Verified locally**: `npm run typecheck` and `npm test` successfully passed.
- **Pending verification**: None.
- **Not fixed / out of scope**: Option B (Lease columns) was not implemented per issue direction (Option A was preferred).
- **Two-Key check**: Not applicable; bug fix and additive status change.
