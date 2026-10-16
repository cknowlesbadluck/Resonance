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

-- 1) Every table in public: RLS enabled/forced and live policy count.
SELECT c.relname                              AS table_name,
       c.relrowsecurity                       AS rls_enabled,
       c.relforcerowsecurity                  AS rls_forced,
       COUNT(p.policyname)                    AS live_policy_count,
       CASE
         WHEN NOT c.relrowsecurity THEN 'FAIL: RLS disabled'
         WHEN COUNT(p.policyname) = 0 THEN 'WARN: RLS on, zero policies (deny-all to anon/authenticated)'
         ELSE 'ok'
       END                                    AS verdict
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE c.relkind IN ('r', 'p')
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY verdict DESC, c.relname;

-- 2) The three tables flagged by #195: full live policy detail.
SELECT tablename, policyname, cmd, roles, permissive, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('capabilities', 'capability_dependencies', 'nexus_execution_requests')
ORDER BY tablename, policyname;

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
  SELECT 1 FROM pg_tables t WHERE t.schemaname = 'public' AND t.tablename = expected.table_name
)
ORDER BY 1;

-- 4) Which migrations Supabase records as applied (if the CLI history table exists).
SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS has_migration_history;
-- If true, run manually:  SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;

ROLLBACK;
