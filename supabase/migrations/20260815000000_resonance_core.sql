create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  category text not null,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  name text not null,
  status text not null default 'disconnected' check (status in ('connected','disconnected','error','pending')),
  capabilities jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  model text,
  status text not null default 'ready' check (status in ('draft','ready','running','blocked','disabled')),
  capabilities jsonb not null default '[]'::jsonb,
  permissions jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, slug)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  version text not null default '1.0.0',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, slug)
);

create table if not exists public.agent_skills (
  agent_id uuid not null references public.agents(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key (agent_id, skill_id)
);

create table if not exists public.mcp_servers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  endpoint text,
  transport text,
  status text not null default 'disabled' check (status in ('healthy','degraded','error','disabled')),
  tools jsonb not null default '[]'::jsonb,
  permissions jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, slug)
);

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  version integer not null default 1,
  definition jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, slug)
);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'queued' check (status in ('queued','planning','running','waiting','approval_required','failed','cancelled','completed')),
  current_step text,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null,
  status text,
  agent_id uuid references public.agents(id) on delete set null,
  skill_id uuid references public.skills(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user','agent','system','integration')),
  action text not null,
  resource_type text,
  resource_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_integrations_project on public.integrations(project_id);
create index if not exists idx_agents_project on public.agents(project_id);
create index if not exists idx_skills_project on public.skills(project_id);
create index if not exists idx_mcp_servers_project on public.mcp_servers(project_id);
create index if not exists idx_workflows_project on public.workflows(project_id);
create index if not exists idx_workflow_runs_project_created on public.workflow_runs(project_id, created_at desc);
create index if not exists idx_workflow_events_run_created on public.workflow_events(run_id, created_at);
create index if not exists idx_audit_events_project_created on public.audit_events(project_id, created_at desc);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.integrations enable row level security;
alter table public.agents enable row level security;
alter table public.skills enable row level security;
alter table public.agent_skills enable row level security;
alter table public.mcp_servers enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.workflow_events enable row level security;
alter table public.audit_events enable row level security;

create or replace function public.is_project_member(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.project_members
    where project_id = target_project and user_id = auth.uid()
  );
$$;

create policy projects_member_select on public.projects for select using (public.is_project_member(id));
create policy project_members_self_select on public.project_members for select using (user_id = auth.uid() or public.is_project_member(project_id));
create policy integrations_member_all on public.integrations for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy agents_member_all on public.agents for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy skills_member_all on public.skills for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy agent_skills_member_all on public.agent_skills for all using (exists (select 1 from public.agents a where a.id = agent_id and public.is_project_member(a.project_id))) with check (exists (select 1 from public.agents a where a.id = agent_id and public.is_project_member(a.project_id)));
create policy mcp_servers_member_all on public.mcp_servers for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy workflows_member_all on public.workflows for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy workflow_runs_member_all on public.workflow_runs for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy workflow_events_member_all on public.workflow_events for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy audit_events_member_select on public.audit_events for select using (public.is_project_member(project_id));

insert into public.providers (key, name, category) values
  ('openai', 'OpenAI', 'ai'),
  ('github', 'GitHub', 'source_control'),
  ('supabase', 'Supabase', 'backend'),
  ('linear', 'Linear', 'project_management'),
  ('figma', 'Figma', 'design'),
  ('mcp', 'Model Context Protocol', 'tools'),
  ('brainbase', 'Brainbase', 'agent_runtime')
on conflict (key) do nothing;
