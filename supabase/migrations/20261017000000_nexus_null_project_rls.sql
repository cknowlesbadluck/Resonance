-- NOT APPLIED. The owner must apply this migration (supabase db push / SQL editor)
-- after review. Additive policy replacement only; no data changes.
--
-- Problem: the six Nexus graph tables carried policies of the form
--   for all using (project_id is null or private.is_project_member(project_id))
--            with check (project_id is null or private.is_project_member(project_id))
-- with no `to` role, so they applied to `anon` as well as `authenticated`.
-- Because `project_id is null` short-circuits before the membership check, any
-- holder of the public anon key could read, insert, update and delete rows whose
-- project_id is null (unscoped executions, context entries, evidence, identities,
-- resources and capabilities), and could create new unscoped rows.
--
-- Fix:
--   * every policy is scoped `to authenticated` (anon gets nothing);
--   * writes require a non-null project the caller is a member of;
--   * unscoped (project_id is null) rows stay readable only for the catalog-like
--     tables (identities, resources, capabilities) and only to authenticated users;
--   * unscoped executions, context entries and evidence are no longer exposed to
--     clients at all. The server uses the service role, which bypasses RLS, so the
--     app's own persistence is unaffected.

drop policy if exists nexus_identities_member_all on public.nexus_identities;
drop policy if exists nexus_resources_member_all on public.nexus_resources;
drop policy if exists nexus_capabilities_member_all on public.nexus_capabilities;
drop policy if exists nexus_context_member_all on public.nexus_context_entries;
drop policy if exists nexus_execution_member_all on public.nexus_executions;
drop policy if exists nexus_evidence_member_select on public.nexus_evidence;

-- Catalog-like tables: global (null-project) rows readable by authenticated users,
-- project rows by members; writes by members of a concrete project only.
create policy nexus_identities_read on public.nexus_identities
  for select to authenticated
  using (project_id is null or private.is_project_member(project_id));
create policy nexus_identities_member_write on public.nexus_identities
  for all to authenticated
  using (project_id is not null and private.is_project_member(project_id))
  with check (project_id is not null and private.is_project_member(project_id));

create policy nexus_resources_read on public.nexus_resources
  for select to authenticated
  using (project_id is null or private.is_project_member(project_id));
create policy nexus_resources_member_write on public.nexus_resources
  for all to authenticated
  using (project_id is not null and private.is_project_member(project_id))
  with check (project_id is not null and private.is_project_member(project_id));

create policy nexus_capabilities_read on public.nexus_capabilities
  for select to authenticated
  using (project_id is null or private.is_project_member(project_id));
create policy nexus_capabilities_member_write on public.nexus_capabilities
  for all to authenticated
  using (project_id is not null and private.is_project_member(project_id))
  with check (project_id is not null and private.is_project_member(project_id));

-- Execution-plane tables: members of a concrete project only.
create policy nexus_context_member_all on public.nexus_context_entries
  for all to authenticated
  using (project_id is not null and private.is_project_member(project_id))
  with check (project_id is not null and private.is_project_member(project_id));

create policy nexus_execution_member_all on public.nexus_executions
  for all to authenticated
  using (project_id is not null and private.is_project_member(project_id))
  with check (project_id is not null and private.is_project_member(project_id));

create policy nexus_evidence_member_select on public.nexus_evidence
  for select to authenticated
  using (project_id is not null and private.is_project_member(project_id));
