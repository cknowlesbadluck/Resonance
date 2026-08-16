alter table public.projects enable row level security;
alter table public.project_members enable row level security;

revoke all on function public.is_project_member(uuid) from public;
revoke all on function public.is_project_member(uuid) from anon;
revoke all on function public.is_project_member(uuid) from authenticated;

drop function if exists public.is_project_member(uuid);