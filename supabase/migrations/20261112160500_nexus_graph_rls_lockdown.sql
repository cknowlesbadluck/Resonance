-- Security correction: the original Nexus graph policies had no explicit TO role
-- and allowed project_id IS NULL for every action. That made the policies apply to
-- anon as well as authenticated and allowed unscoped rows to be read or mutated.
--
-- This additive migration is intentionally NOT applied by CI. Review the live RLS
-- state, then the owner must apply it through the Supabase migration workflow.
-- Server-side service-role persistence remains unaffected (service role bypasses RLS).

-- RLS does not govern TRUNCATE, REFERENCES, TRIGGER or MAINTAIN privileges.
-- The live ACL audit found anon had broad table privileges and authenticated had
-- TRUNCATE on execution tables. Remove those grants explicitly; preserve only the
-- row-level access required by each authenticated API surface.
REVOKE ALL PRIVILEGES ON TABLE
  public.events,
  public.nexus_execution_requests,
  public.project_members,
  public.projects,
  public.nexus_identities,
  public.nexus_resources,
  public.nexus_capabilities,
  public.nexus_context_entries,
  public.nexus_executions,
  public.nexus_evidence,
  public.providers
FROM anon, PUBLIC;

REVOKE ALL PRIVILEGES ON TABLE
  public.events,
  public.nexus_execution_requests,
  public.project_members,
  public.projects,
  public.nexus_identities,
  public.nexus_resources,
  public.nexus_capabilities,
  public.nexus_context_entries,
  public.nexus_executions,
  public.nexus_evidence,
  public.providers
FROM authenticated;

GRANT SELECT, INSERT ON TABLE public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.nexus_execution_requests TO authenticated;
GRANT SELECT ON TABLE public.project_members, public.projects TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.nexus_identities,
  public.nexus_resources,
  public.nexus_capabilities,
  public.nexus_context_entries,
  public.nexus_executions
TO authenticated;

GRANT SELECT ON TABLE public.nexus_evidence, public.providers TO authenticated;

-- Stop the same broad defaults from being reintroduced by future migrations.
-- Both roles have been observed creating public-schema objects in this project.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM anon, PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated;
-- Future public-schema objects start inaccessible. Each future API table must
-- receive explicit grants and an RLS policy in the same reviewed migration.
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, PUBLIC, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, PUBLIC, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, PUBLIC, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, PUBLIC, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, PUBLIC, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon, PUBLIC, authenticated;

-- The membership predicate is SECURITY DEFINER and fully schema-qualifies
-- its references. Pin an empty search_path to remove object-shadowing risk.
ALTER FUNCTION private.is_project_member(uuid) SET search_path = '';

-- Other public API tables also used PUBLIC policies. Their predicates are
-- membership-aware, but explicit TO authenticated makes the boundary unambiguous.
DROP POLICY IF EXISTS "project members can create events" ON public.events;
DROP POLICY IF EXISTS events_insert_project_members ON public.events;
DROP POLICY IF EXISTS events_select_project_members ON public.events;
DROP POLICY IF EXISTS "project members can read events" ON public.events;
DROP POLICY IF EXISTS "project members can create execution requests" ON public.nexus_execution_requests;
DROP POLICY IF EXISTS "project members can read execution requests" ON public.nexus_execution_requests;
DROP POLICY IF EXISTS "project members can update execution requests" ON public.nexus_execution_requests;
DROP POLICY IF EXISTS nexus_execution_requests_member_select ON public.nexus_execution_requests;
DROP POLICY IF EXISTS nexus_execution_requests_member_insert ON public.nexus_execution_requests;
DROP POLICY IF EXISTS nexus_execution_requests_member_update ON public.nexus_execution_requests;
DROP POLICY IF EXISTS project_members_self_select ON public.project_members;
DROP POLICY IF EXISTS projects_member_select ON public.projects;

CREATE POLICY events_member_insert
  ON public.events FOR INSERT TO authenticated
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY events_member_select
  ON public.events FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id));

CREATE POLICY execution_requests_member_insert
  ON public.nexus_execution_requests FOR INSERT TO authenticated
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY execution_requests_member_select
  ON public.nexus_execution_requests FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY execution_requests_member_update
  ON public.nexus_execution_requests FOR UPDATE TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id))
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));

CREATE POLICY project_members_self_select
  ON public.project_members FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.is_project_member(project_id));
CREATE POLICY projects_member_select
  ON public.projects FOR SELECT TO authenticated
  USING (private.is_project_member(id));

-- Remove the original broad policies.
DROP POLICY IF EXISTS nexus_identities_member_all ON public.nexus_identities;
DROP POLICY IF EXISTS nexus_resources_member_all ON public.nexus_resources;
DROP POLICY IF EXISTS nexus_capabilities_member_all ON public.nexus_capabilities;
DROP POLICY IF EXISTS nexus_context_member_all ON public.nexus_context_entries;
DROP POLICY IF EXISTS nexus_execution_member_all ON public.nexus_executions;
DROP POLICY IF EXISTS nexus_evidence_member_select ON public.nexus_evidence;

-- Also remove the split capability policies from the November consolidation migration.
DROP POLICY IF EXISTS nexus_capabilities_read ON public.nexus_capabilities;
DROP POLICY IF EXISTS nexus_capabilities_member_insert ON public.nexus_capabilities;
DROP POLICY IF EXISTS nexus_capabilities_member_update ON public.nexus_capabilities;
DROP POLICY IF EXISTS nexus_capabilities_member_delete ON public.nexus_capabilities;

-- Catalog-like graph data: authenticated users may read global catalog rows;
-- project rows are visible to members. All mutations require a concrete project.
CREATE POLICY nexus_identities_read
  ON public.nexus_identities FOR SELECT TO authenticated
  USING (project_id IS NULL OR private.is_project_member(project_id));
CREATE POLICY nexus_identities_member_insert
  ON public.nexus_identities FOR INSERT TO authenticated
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY nexus_identities_member_update
  ON public.nexus_identities FOR UPDATE TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id))
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY nexus_identities_member_delete
  ON public.nexus_identities FOR DELETE TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id));

CREATE POLICY nexus_resources_read
  ON public.nexus_resources FOR SELECT TO authenticated
  USING (project_id IS NULL OR private.is_project_member(project_id));
CREATE POLICY nexus_resources_member_insert
  ON public.nexus_resources FOR INSERT TO authenticated
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY nexus_resources_member_update
  ON public.nexus_resources FOR UPDATE TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id))
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY nexus_resources_member_delete
  ON public.nexus_resources FOR DELETE TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id));

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

-- Execution data is never globally visible. Every operation is project-member scoped.
CREATE POLICY nexus_context_member_all
  ON public.nexus_context_entries FOR ALL TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id))
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY nexus_execution_member_all
  ON public.nexus_executions FOR ALL TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id))
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY nexus_evidence_member_select
  ON public.nexus_evidence FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id));
