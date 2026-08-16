create table if not exists public.nexus_identities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  type text not null,
  name text not null,
  provider_id uuid references public.providers(id) on delete set null,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(project_id, type, provider_id, external_id)
);

create table if not exists public.nexus_resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  type text not null,
  name text not null,
  provider_id uuid references public.providers(id) on delete set null,
  external_id text,
  uri text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.nexus_capabilities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  capability_key text not null,
  name text not null,
  description text,
  provider_id uuid references public.providers(id) on delete set null,
  identity_id uuid references public.nexus_identities(id) on delete set null,
  adapter_id text,
  resource_type text,
  required_permissions jsonb not null default '[]'::jsonb,
  risk text not null default 'low' check (risk in ('low','medium','high','critical')),
  input_schema jsonb,
  output_schema jsonb,
  tags jsonb not null default '[]'::jsonb,
  compatibility jsonb not null default '[]'::jsonb,
  availability text not null default 'available' check (availability in ('available','degraded','unavailable')),
  provenance text,
  version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nexus_context_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  scope text not null,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  visibility text not null default 'private' check (visibility in ('private','participants','project')),
  created_by text not null,
  provenance text,
  persistent boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.nexus_executions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  plan_id text not null,
  status text not null,
  output jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.nexus_evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  execution_id uuid references public.nexus_executions(id) on delete cascade,
  evidence_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_nexus_capability_key on public.nexus_capabilities(project_id, capability_key);
create index if not exists idx_nexus_capability_provider on public.nexus_capabilities(provider_id);
create index if not exists idx_nexus_resource_provider on public.nexus_resources(provider_id);
create index if not exists idx_nexus_context_scope on public.nexus_context_entries(project_id, scope, created_at desc);
create index if not exists idx_nexus_execution_project on public.nexus_executions(project_id, created_at desc);
create index if not exists idx_nexus_evidence_execution on public.nexus_evidence(execution_id, created_at);

alter table public.nexus_identities enable row level security;
alter table public.nexus_resources enable row level security;
alter table public.nexus_capabilities enable row level security;
alter table public.nexus_context_entries enable row level security;
alter table public.nexus_executions enable row level security;
alter table public.nexus_evidence enable row level security;

create policy nexus_identities_member_all on public.nexus_identities for all using (project_id is null or public.is_project_member(project_id)) with check (project_id is null or public.is_project_member(project_id));
create policy nexus_resources_member_all on public.nexus_resources for all using (project_id is null or public.is_project_member(project_id)) with check (project_id is null or public.is_project_member(project_id));
create policy nexus_capabilities_member_all on public.nexus_capabilities for all using (project_id is null or public.is_project_member(project_id)) with check (project_id is null or public.is_project_member(project_id));
create policy nexus_context_member_all on public.nexus_context_entries for all using (project_id is null or public.is_project_member(project_id)) with check (project_id is null or public.is_project_member(project_id));
create policy nexus_execution_member_all on public.nexus_executions for all using (project_id is null or public.is_project_member(project_id)) with check (project_id is null or public.is_project_member(project_id));
create policy nexus_evidence_member_select on public.nexus_evidence for select using (project_id is null or public.is_project_member(project_id));
