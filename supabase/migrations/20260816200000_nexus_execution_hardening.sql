alter table public.nexus_capabilities
  add column if not exists cost numeric,
  add column if not exists latency_ms integer;

alter table public.nexus_executions
  add column if not exists attempts integer not null default 0;

create index if not exists idx_nexus_capability_availability
  on public.nexus_capabilities(project_id, availability, capability_key);

create index if not exists idx_nexus_execution_status
  on public.nexus_executions(project_id, status, created_at desc);

comment on column public.nexus_capabilities.cost is 'Provider-reported normalized cost metadata; optional.';
comment on column public.nexus_capabilities.latency_ms is 'Observed or provider-reported latency metadata; optional.';
