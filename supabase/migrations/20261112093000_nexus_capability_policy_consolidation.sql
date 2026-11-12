-- Consolidate SELECT access into one permissive policy and separate write actions.
-- This preserves the same row-level access while avoiding repeated SELECT policy evaluation.
DROP POLICY IF EXISTS nexus_capabilities_global_read ON public.nexus_capabilities;
DROP POLICY IF EXISTS nexus_capabilities_member_read ON public.nexus_capabilities;
DROP POLICY IF EXISTS nexus_capabilities_member_write ON public.nexus_capabilities;

CREATE POLICY nexus_capabilities_read
  ON public.nexus_capabilities FOR SELECT TO authenticated
  USING (project_id IS NULL OR private.is_project_member(project_id));

CREATE POLICY nexus_capabilities_member_insert
  ON public.nexus_capabilities FOR INSERT TO authenticated
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));

CREATE POLICY nexus_capabilities_member_update
  ON public.nexus_capabilities FOR UPDATE TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id))
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));

CREATE POLICY nexus_capabilities_member_delete
  ON public.nexus_capabilities FOR DELETE TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id));
