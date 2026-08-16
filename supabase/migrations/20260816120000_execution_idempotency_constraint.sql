create unique index if not exists idx_nexus_execution_project_idempotency
  on public.nexus_executions(project_id, idempotency_key)
  where idempotency_key is not null;

comment on index public.idx_nexus_execution_project_idempotency is
  'Prevents duplicate execution records for the same project-scoped idempotency key.';
