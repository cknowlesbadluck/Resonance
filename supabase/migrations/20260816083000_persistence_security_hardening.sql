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

drop policy if exists projects_member_select on public.projects;
drop policy if exists project_members_self_select on public.project_members;
drop policy if exists integrations_member_all on public.integrations;
drop policy if exists agents_member_all on public.agents;
drop policy if exists skills_member_all on public.skills;
drop policy if exists agent_skills_member_all on public.agent_skills;
drop policy if exists mcp_servers_member_all on public.mcp_servers;
drop policy if exists workflows_member_all on public.workflows;
drop policy if exists workflow_runs_member_all on public.workflow_runs;
drop policy if exists workflow_events_member_all on public.workflow_events;
drop policy if exists audit_events_member_select on public.audit_events;

create policy projects_member_select on public.projects
  for select using (private.is_project_member(id));

create policy project_members_self_select on public.project_members
  for select using (user_id = auth.uid() or private.is_project_member(project_id));

create policy integrations_member_all on public.integrations
  for all using (private.is_project_member(project_id))
  with check (private.is_project_member(project_id));

create policy agents_member_all on public.agents
  for all using (private.is_project_member(project_id))
  with check (private.is_project_member(project_id));

create policy skills_member_all on public.skills
  for all using (private.is_project_member(project_id))
  with check (private.is_project_member(project_id));

create policy agent_skills_member_all on public.agent_skills
  for all
  using (exists (
    select 1 from public.agents a
    where a.id = agent_id and private.is_project_member(a.project_id)
  ))
  with check (exists (
    select 1 from public.agents a
    where a.id = agent_id and private.is_project_member(a.project_id)
  ));

create policy mcp_servers_member_all on public.mcp_servers
  for all using (private.is_project_member(project_id))
  with check (private.is_project_member(project_id));

create policy workflows_member_all on public.workflows
  for all using (private.is_project_member(project_id))
  with check (private.is_project_member(project_id));

create policy workflow_runs_member_all on public.workflow_runs
  for all using (private.is_project_member(project_id))
  with check (private.is_project_member(project_id));

create policy workflow_events_member_all on public.workflow_events
  for all using (private.is_project_member(project_id))
  with check (private.is_project_member(project_id));

create policy audit_events_member_select on public.audit_events
  for select using (private.is_project_member(project_id));

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
