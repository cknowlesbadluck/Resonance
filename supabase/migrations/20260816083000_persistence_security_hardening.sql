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

-- Keep the exposed public policies, but route their membership check through the
-- non-PostgREST private function so the SECURITY DEFINER helper is not directly callable.
drop policy if exists projects_member_select on public.projects;
drop policy if exists project_members_self_select on public.project_members;
drop policy if exists nexus_identities_member_all on public.nexus_identities;
drop policy if exists nexus_resources_member_all on public.nexus_resources;
drop policy if exists nexus_capabilities_member_all on public.nexus_capabilities;
drop policy if exists nexus_context_member_all on public.nexus_context_entries;
drop policy if exists nexus_execution_member_all on public.nexus_executions;
drop policy if exists nexus_evidence_member_select on public.nexus_evidence;

create policy projects_member_select on public.projects
  for select using (private.is_project_member(id));

create policy project_members_self_select on public.project_members
  for select using (user_id = auth.uid() or private.is_project_member(project_id));

create policy nexus_identities_member_all on public.nexus_identities
  for all using (project_id is null or private.is_project_member(project_id))
  with check (project_id is null or private.is_project_member(project_id));

create policy nexus_resources_member_all on public.nexus_resources
  for all using (project_id is null or private.is_project_member(project_id))
  with check (project_id is null or private.is_project_member(project_id));

create policy nexus_capabilities_member_all on public.nexus_capabilities
  for all using (project_id is null or private.is_project_member(project_id))
  with check (project_id is null or private.is_project_member(project_id));

create policy nexus_context_member_all on public.nexus_context_entries
  for all using (project_id is null or private.is_project_member(project_id))
  with check (project_id is null or private.is_project_member(project_id));

create policy nexus_execution_member_all on public.nexus_executions
  for all using (project_id is null or private.is_project_member(project_id))
  with check (project_id is null or private.is_project_member(project_id));

create policy nexus_evidence_member_select on public.nexus_evidence
  for select using (project_id is null or private.is_project_member(project_id));

alter table public.providers enable row level security;
create policy providers_authenticated_select on public.providers
  for select to authenticated
  using (true);

create index if not exists idx_nexus_capabilities_identity
  on public.nexus_capabilities(identity_id);

create index if not exists idx_nexus_evidence_project
  on public.nexus_evidence(project_id);

create index if not exists idx_nexus_identities_provider
  on public.nexus_identities(provider_id);

create index if not exists idx_nexus_resources_project
  on public.nexus_resources(project_id);