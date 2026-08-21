-- Support bounded, durable execution admission checks without process-local state.
create index if not exists idx_nexus_execution_requests_project_created
  on public.nexus_execution_requests(project_id, created_at desc);
