# Verifying live RLS against migrations

`scripts/verify-rls.sql` is a **read-only** check the owner runs by hand against the
live Supabase database. It exists to settle the migration-vs-live drift found by #195
(`capabilities`, `capability_dependencies`, `nexus_execution_requests`).

- Runs inside `BEGIN TRANSACTION READ ONLY … ROLLBACK`; only reads `pg_catalog`/`pg_policies`.
- Not wired into CI, tests, or the build. Nothing in this repo executes it.

## Run

```bash
psql "$DATABASE_URL" -f scripts/verify-rls.sql
```
or paste it into the Supabase SQL editor.

## Reading the output

1. Per-table verdict: `FAIL` = RLS disabled; `WARN` = RLS on but zero policies.
2. Live policies on the three flagged tables. Empty = drift confirmed.
3. Tables declared in migrations but missing live = migrations not fully applied.
4. Whether Supabase migration history exists, so you can compare applied versions with
   `supabase/migrations/`.

If drift is confirmed, the fix is to apply the pending migrations through the normal
reviewed path (`supabase db push` by the owner). This script never applies anything.
