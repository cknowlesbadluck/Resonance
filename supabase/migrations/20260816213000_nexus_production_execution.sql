alter table public.nexus_executions
  add column if not exists idempotency_key text;

create unique index if not exists idx_nexus_execution_idempotency
  on public.nexus_executions(project_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_nexus_evidence_project_created
  on public.nexus_evidence(project_id, created_at desc);
