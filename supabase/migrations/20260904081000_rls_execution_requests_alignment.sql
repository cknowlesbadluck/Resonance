-- DB-01: ensure membership helper exists and execution-request policies are consistent.

create schema if not exists private;

create or replace function private.is_project_member(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = target_project
      and user_id = auth.uid()
  );
$$;

revoke all on function private.is_project_member(uuid) from public;
grant execute on function private.is_project_member(uuid) to authenticated;

alter table public.nexus_execution_requests enable row level security;

drop policy if exists "project members can read execution requests" on public.nexus_execution_requests;
drop policy if exists "project members can create execution requests" on public.nexus_execution_requests;
drop policy if exists "project members can update execution requests" on public.nexus_execution_requests;

create policy nexus_execution_requests_member_select
  on public.nexus_execution_requests
  for select
  using (private.is_project_member(project_id));

create policy nexus_execution_requests_member_insert
  on public.nexus_execution_requests
  for insert
  with check (private.is_project_member(project_id));

create policy nexus_execution_requests_member_update
  on public.nexus_execution_requests
  for update
  using (private.is_project_member(project_id))
  with check (private.is_project_member(project_id));
