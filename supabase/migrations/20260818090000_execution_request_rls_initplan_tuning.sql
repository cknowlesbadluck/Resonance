-- Avoid per-row re-evaluation of auth.uid() in execution-request RLS policies.
drop policy if exists "project members can read execution requests" on public.nexus_execution_requests;
create policy "project members can read execution requests"
on public.nexus_execution_requests for select
using (exists (
  select 1 from public.project_members pm
  where pm.project_id = nexus_execution_requests.project_id
    and pm.user_id = (select auth.uid())
));

drop policy if exists "project members can create execution requests" on public.nexus_execution_requests;
create policy "project members can create execution requests"
on public.nexus_execution_requests for insert
with check (exists (
  select 1 from public.project_members pm
  where pm.project_id = nexus_execution_requests.project_id
    and pm.user_id = (select auth.uid())
));

drop policy if exists "project members can update execution requests" on public.nexus_execution_requests;
create policy "project members can update execution requests"
on public.nexus_execution_requests for update
using (exists (
  select 1 from public.project_members pm
  where pm.project_id = nexus_execution_requests.project_id
    and pm.user_id = (select auth.uid())
));
