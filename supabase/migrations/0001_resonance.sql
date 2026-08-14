create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(), provider text not null, name text not null,
  status text not null default 'disconnected', capabilities jsonb not null default '[]'::jsonb,
  config jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider, name)
);
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade,
  provider text not null, resource_type text not null, external_id text not null, name text,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider, resource_type, external_id)
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete set null,
  source text not null, type text not null, status text not null default 'received', external_id text,
  payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), processed_at timestamptz
);
create index if not exists events_created_at_idx on public.events(created_at desc);
create index if not exists events_source_type_idx on public.events(source, type);
create unique index if not exists events_external_id_idx on public.events(source, external_id) where external_id is not null;
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete cascade,
  name text not null, description text, enabled boolean not null default true, definition jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(), workflow_id uuid references public.workflows(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null, status text not null default 'queued', input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb, error text, started_at timestamptz, finished_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor text not null, action text not null, provider text,
  resource_type text, resource_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
alter table public.projects enable row level security;
alter table public.integrations enable row level security;
alter table public.resources enable row level security;
alter table public.events enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.audit_logs enable row level security;
