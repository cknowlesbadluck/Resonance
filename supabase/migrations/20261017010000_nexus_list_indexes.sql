-- NOT APPLIED. The owner must apply this migration after review.
-- Additive indexes only; no data or policy changes.
--
-- GET /api/nexus/executions runs, on every call, via SupabaseNexusPersistence:
--   nexus_executions: where project_id = $1 order by started_at desc limit 100
--   nexus_evidence:   where project_id = $1 order by created_at desc limit 200
-- The existing indexes are idx_nexus_execution_project (project_id, created_at desc),
-- which cannot serve ORDER BY started_at, and idx_nexus_evidence_project (project_id),
-- which has no sort key. Both queries therefore read every row of the project and sort
-- before applying the LIMIT. These composite indexes let Postgres walk the index
-- in order and stop at the LIMIT.
--
-- For large tables, consider running the equivalent CREATE INDEX CONCURRENTLY statements
-- by hand outside a transaction instead of applying this file as-is.

create index if not exists idx_nexus_executions_project_started
  on public.nexus_executions (project_id, started_at desc);

create index if not exists idx_nexus_evidence_project_created
  on public.nexus_evidence (project_id, created_at desc);
