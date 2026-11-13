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

1. Per-table verdict: `FAIL` = RLS disabled; `WARN` = RLS on but **no permissive** policies
   (restrictive policies alone grant nothing, so this is deny-all to anon/authenticated).
2. Live policy detail on the three flagged tables.
2b. Per-policy comparison with the migrations (name, command, permissive, roles, and the
   `USING` / `WITH CHECK` predicates): every row should be `ok`. `MISSING live`, `MISMATCH …`
   or `EXTRA live` is drift, even if the table has *some* policy. The expected set is kept
   in sync by hand; #195's `lib/db/rls-lint.test.ts` pins the same names in CI once merged.
3. Tables declared in migrations but missing live = migrations not fully applied.
4. Whether Supabase migration history exists, so you can compare applied versions with
   `supabase/migrations/`.

This script never applies anything. If drift is confirmed, first decide which kind it is
using check 4 (`SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;`):

- **Pending migrations** (the versions declaring the missing policies are *not* recorded):
  the owner applies them through the normal reviewed path, bound to the **same database
  that was just verified** — e.g. `supabase db push --db-url "$DATABASE_URL" --include-all --dry-run`,
  review the list, then rerun without `--dry-run`. `--include-all` is needed when an older
  migration is unrecorded but later versions are already recorded; without it the CLI
  refuses or skips the out-of-order file. Do not rely on whatever project the local CLI
  happens to be linked to; this repo tracks no Supabase link.
- **Partially applied but unrecorded** (2b shows some of a migration's policies live and
  others missing, yet its version is not recorded): do **not** push it as-is — its
  `CREATE POLICY` statements will fail on the objects that already exist and the whole
  migration rolls back. Treat it like recorded drift below (a reviewed repair migration
  written to be idempotent), and settle the history entry as part of that review.
- **Already-recorded drift** (the versions *are* recorded but the policies are missing or
  different live): `db push` will do nothing, because it only runs unrecorded migrations.
  The fix is a **new, reviewed repair migration** that recreates the expected policies,
  merged and applied like any other migration. Never hand-edit the live database or the
  migration history table.

Re-run this script afterwards; all of check 2b should read `ok`.
