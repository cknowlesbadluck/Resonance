-- scripts/verify-rls.sql
-- READ-ONLY verification of live Row Level Security posture vs. what the
-- migrations in supabase/migrations/ declare. Settles the drift reported by
-- PR #195 (capabilities, capability_dependencies, nexus_execution_requests have
-- policies in migrations but reportedly none live).
--
-- Safety: the whole script runs inside a READ ONLY transaction and ends with
-- ROLLBACK. It only SELECTs from pg_catalog / pg_policies. It changes nothing.
-- Nothing in this repo (CI, tests, build) executes it; the owner runs it by hand:
--   psql "$DATABASE_URL" -f scripts/verify-rls.sql      (or paste into Supabase SQL editor)

BEGIN TRANSACTION READ ONLY;
-- Resolve catalog names only from pg_catalog so nothing in public can shadow them.
SET LOCAL search_path = pg_catalog, pg_temp;

-- 1) Every table in public: RLS enabled/forced and live policy count.
SELECT c.relname                              AS table_name,
       c.relrowsecurity                       AS rls_enabled,
       c.relforcerowsecurity                  AS rls_forced,
       COUNT(p.policyname)                    AS live_policy_count,
       COUNT(p.policyname) FILTER (WHERE p.permissive = 'PERMISSIVE') AS live_permissive_count,
       CASE
         WHEN NOT c.relrowsecurity THEN 'FAIL: RLS disabled'
         WHEN COUNT(p.policyname) FILTER (WHERE p.permissive = 'PERMISSIVE') = 0
           THEN 'WARN: RLS on, no permissive policies (deny-all to anon/authenticated)'
         ELSE 'ok'
       END                                    AS verdict
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_catalog.pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE c.relkind IN ('r', 'p')
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY verdict DESC, c.relname;

-- 2) The three tables flagged by #195: full live policy detail.
SELECT tablename, policyname, cmd, roles, permissive, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('capabilities', 'capability_dependencies', 'nexus_execution_requests')
ORDER BY tablename, policyname;

-- 2b) Per-policy comparison against what the migrations declare for those tables
--     (kept in sync by hand with supabase/migrations; PR #195 adds lib/db/rls-lint.test.ts,
--     which pins the same policy names in CI once merged). Any row whose
--     status is not 'ok' is drift: a missing policy, a wrong command, or an extra policy.
WITH expected(tablename, policyname, cmd, roles, qual_like, check_like) AS (
  -- qual_like / check_like: NULL = must be absent; otherwise a LIKE pattern the live
  -- expression must match (pg_policies stores the deparsed expression text).
  VALUES
    ('capabilities',             'authenticated users can read capabilities',            'SELECT', '{authenticated}', 'true', NULL),
    ('capability_dependencies',  'authenticated users can read capability dependencies', 'SELECT', '{authenticated}', 'true', NULL),
    ('nexus_execution_requests', 'nexus_execution_requests_member_select',               'SELECT', '{public}', '%is_project_member(project_id)%', NULL),
    ('nexus_execution_requests', 'nexus_execution_requests_member_insert',               'INSERT', '{public}', NULL, '%is_project_member(project_id)%'),
    ('nexus_execution_requests', 'nexus_execution_requests_member_update',               'UPDATE', '{public}', '%is_project_member(project_id)%', '%is_project_member(project_id)%')
), live AS (
  SELECT tablename::text, policyname::text, cmd::text, permissive::text,
         roles::text AS roles, qual::text AS qual, with_check::text AS with_check
  FROM pg_catalog.pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('capabilities', 'capability_dependencies', 'nexus_execution_requests')
), compared AS (
  SELECT COALESCE(e.tablename, l.tablename)   AS table_name,
         COALESCE(e.policyname, l.policyname) AS policy_name,
         e.cmd AS expected_cmd, l.cmd AS live_cmd,
         e.roles AS expected_roles, l.roles AS live_roles,
         l.qual AS live_using, l.with_check AS live_with_check,
         CASE
           WHEN l.policyname IS NULL THEN 'MISSING live'
           WHEN e.policyname IS NULL THEN 'EXTRA live (not in migrations)'
           WHEN l.cmd <> e.cmd THEN 'MISMATCH cmd'
           WHEN l.permissive <> 'PERMISSIVE' THEN 'MISMATCH not permissive'
           WHEN l.roles <> e.roles THEN 'MISMATCH roles'
           WHEN (e.qual_like IS NULL) <> (l.qual IS NULL)
             OR (e.qual_like IS NOT NULL AND l.qual NOT LIKE e.qual_like) THEN 'MISMATCH using predicate'
           WHEN (e.check_like IS NULL) <> (l.with_check IS NULL)
             OR (e.check_like IS NOT NULL AND l.with_check NOT LIKE e.check_like) THEN 'MISMATCH with check predicate'
           ELSE 'ok'
         END AS status
  FROM expected e
  FULL OUTER JOIN live l ON l.tablename = e.tablename AND l.policyname = e.policyname
)
SELECT * FROM compared
ORDER BY (status = 'ok'), table_name, policy_name;

-- 3) Tables the migrations create (kept in sync by hand from supabase/migrations)
--    that are missing live. A non-empty result means migrations were not all applied.
SELECT expected.table_name AS missing_live_table
FROM unnest(ARRAY[
  'agendas','agent_skills','agents','audit_events','audit_logs','capabilities',
  'capability_dependencies','chamber_participants','context_entries','events',
  'integrations','mcp_servers','nexus_capabilities','nexus_context_entries',
  'nexus_evidence','nexus_execution_requests','nexus_executions','nexus_identities',
  'nexus_resources','project_members','projects','providers','resources','skills',
  'toolkit_pulls','workflow_events','workflow_runs','workflows'
]) AS expected(table_name)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_catalog.pg_tables t WHERE t.schemaname = 'public' AND t.tablename = expected.table_name
)
ORDER BY 1;

-- 4) Which migrations Supabase records as applied (if the CLI history table exists).
SELECT pg_catalog.to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS has_migration_history;
-- If true, run manually:  SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;

ROLLBACK;
