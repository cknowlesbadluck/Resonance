-- Resonance: Agenda + Chamber composition fabric extension
-- Builds on 20260815000000_resonance_core.sql

-- Agendas
create table if not exists public.agendas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  goal text not null,
  constraints jsonb not null default '[]'::jsonb,
  success_criteria jsonb not null default '[]'::jsonb,
  preferred_agents jsonb not null default '[]'::jsonb,
  preferred_skills jsonb not null default '[]'::jsonb,
  privacy_ceiling text not null default 'project'
    check (privacy_ceiling in ('public', 'project', 'private', 'strict')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Extend workflow_runs with Chamber semantics
alter table public.workflow_runs
  add column if not exists agenda_id uuid references public.agendas(id) on delete set null,
  add column if not exists chamber_status text
    check (chamber_status is null or chamber_status in ('forming', 'active', 'paused', 'dissolving', 'dissolved')),
  add column if not exists context_plane jsonb not null default '{}'::jsonb,
  add column if not exists toolkit_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists dissolution_reason jsonb;

-- Chamber participants (agents transported into a run/chamber)
create table if not exists public.chamber_participants (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  origin_type text not null default 'project'
    check (origin_type in ('local', 'project', 'remote_bridge')),
  origin_source_id text,
  origin_display_name text not null,
  role text not null default 'contributor',
  status text not null default 'activating'
    check (status in ('activating', 'active', 'paused', 'exited')),
  permissions jsonb not null default '[]'::jsonb,
  joined_at timestamptz not null default now(),
  exited_at timestamptz,
  unique(run_id, agent_id)
);

-- Toolkit pull history (dynamic resource additions)
create table if not exists public.toolkit_pulls (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  query text not null,
  added_plugins jsonb not null default '[]'::jsonb,
  requested_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Context plane entries (scoped shared memory)
create table if not exists public.context_entries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.workflow_runs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  visibility text not null default 'all'
    check (visibility in ('all', 'agents', 'specific')),
  visible_to jsonb not null default '[]'::jsonb,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_agendas_project on public.agendas(project_id);
create index if not exists idx_chamber_participants_run on public.chamber_participants(run_id);
create index if not exists idx_chamber_participants_agent on public.chamber_participants(agent_id);
create index if not exists idx_toolkit_pulls_run on public.toolkit_pulls(run_id);
create index if not exists idx_context_entries_run on public.context_entries(run_id);
create index if not exists idx_workflow_runs_agenda on public.workflow_runs(agenda_id);

-- RLS
alter table public.agendas enable row level security;
alter table public.chamber_participants enable row level security;
alter table public.toolkit_pulls enable row level security;
alter table public.context_entries enable row level security;

create policy agendas_member_all on public.agendas
  for all using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy chamber_participants_member_all on public.chamber_participants
  for all using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy toolkit_pulls_member_all on public.toolkit_pulls
  for all using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

create policy context_entries_member_all on public.context_entries
  for all using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));
