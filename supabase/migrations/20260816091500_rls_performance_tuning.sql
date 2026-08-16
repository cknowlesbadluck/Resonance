drop policy if exists project_members_self_select on public.project_members;

create policy project_members_self_select on public.project_members
  for select
  using (
    user_id = (select auth.uid())
    or private.is_project_member(project_id)
  );