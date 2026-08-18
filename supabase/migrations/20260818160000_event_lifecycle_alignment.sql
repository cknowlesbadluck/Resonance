-- Durable event lifecycle foundation for Resonance.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source text not null,
  type text not null,
  status text not null default 'received',
  correlation_id text,
  actor_id uuid,
  resource_type text,
  resource_id text,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_project_created_idx on public.events(project_id, created_at desc);
create index if not exists events_correlation_idx on public.events(correlation_id);
create unique index if not exists events_external_id_unique on public.events(project_id, source, external_id) where external_id is not null;

alter table public.events enable row level security;

create policy events_select_project_members on public.events
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = events.project_id and pm.user_id = (select auth.uid())
    )
  );

create policy events_insert_project_members on public.events
  for insert with check (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = events.project_id and pm.user_id = (select auth.uid())
    )
  );

create or replace function public.emit_event(
  p_project_id uuid,
  p_source text,
  p_type text,
  p_status text,
  p_correlation_id text default null,
  p_resource_type text default null,
  p_resource_id text default null,
  p_external_id text default null,
  p_payload jsonb default '{}'::jsonb
) returns public.events
language plpgsql
security invoker
as $$
declare
  v_event public.events;
begin
  insert into public.events(project_id, source, type, status, correlation_id, resource_type, resource_id, external_id, payload)
  values (p_project_id, p_source, p_type, p_status, p_correlation_id, p_resource_type, p_resource_id, p_external_id, coalesce(p_payload, '{}'::jsonb))
  on conflict (project_id, source, external_id) where p_external_id is not null
  do update set updated_at = now()
  returning * into v_event;
  return v_event;
end;
$$;
