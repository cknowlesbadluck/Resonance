-- Harden SECURITY DEFINER helpers against search_path hijacking (Supabase advisor
-- 0011 function_search_path_mutable). Additive and idempotent; NOT applied by this PR.
--
-- private.is_project_member is the only remaining SECURITY DEFINER function
-- (public.is_project_member was dropped in 20260816090000). Its body already
-- schema-qualifies every reference (public.project_members, auth.uid()), so an
-- empty search_path does not change behaviour.

do $$
begin
  if to_regprocedure('private.is_project_member(uuid)') is not null then
    execute 'alter function private.is_project_member(uuid) set search_path = ''''';
  end if;
end
$$;
