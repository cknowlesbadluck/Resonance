-- Durable initiation records make execution requests safely repeatable.
create table if not exists public.nexus_execution_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  idempotency_key text not null,
  execution_id uuid,
  request_hash text not null,
  status text not null default 'accepted' check (status in ('accepted','completed','failed','waiting')),
  response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, idempotency_key)
);

create index if not exists idx_nexus_execution_requests_execution on public.nexus_execution_requests(execution_id);

alter table public.nexus_execution_requests enable row level security;

create policy "project members can read execution requests"
on public.nexus_execution_requests for select
using (exists (
  select 1 from public.project_members pm
  where pm.project_id = nexus_execution_requests.project_id
    and pm.user_id = auth.uid()
));

create policy "project members can create execution requests"
on public.nexus_execution_requests for insert
with check (exists (
  select 1 from public.project_members pm
  where pm.project_id = nexus_execution_requests.project_id
    and pm.user_id = auth.uid()
));

create policy "project members can update execution requests"
on public.nexus_execution_requests for update
using (exists (
  select 1 from public.project_members pm
  where pm.project_id = nexus_execution_requests.project_id
    and pm.user_id = auth.uid()
));
