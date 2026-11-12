-- 20261111000000_nexus_capabilities_sync.sql
-- Keep the legacy catalog tables intact. This migration does not copy their rows,
-- so dropping them (especially with CASCADE) would risk irreversible data loss.
-- Remove them only in a later migration after an explicit data audit and rollback plan.

alter table public.nexus_capabilities add column if not exists dependencies jsonb not null default '[]'::jsonb;

-- The native catalog includes planned capabilities; widen the original check
-- constraint before inserting any of those rows.
alter table public.nexus_capabilities
  drop constraint if exists nexus_capabilities_availability_check;

alter table public.nexus_capabilities
  add constraint nexus_capabilities_availability_check
  check (availability in ('available', 'degraded', 'unavailable', 'planned'));

-- Global catalog entries are readable, but never writable by anon/authenticated.
-- Project-scoped entries remain manageable by authenticated project members.
DROP POLICY IF EXISTS nexus_capabilities_member_all ON public.nexus_capabilities;
CREATE POLICY nexus_capabilities_global_read
  ON public.nexus_capabilities FOR SELECT TO authenticated
  USING (project_id IS NULL);
CREATE POLICY nexus_capabilities_member_read
  ON public.nexus_capabilities FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id));
CREATE POLICY nexus_capabilities_member_write
  ON public.nexus_capabilities FOR ALL TO authenticated
  USING (project_id IS NOT NULL AND private.is_project_member(project_id))
  WITH CHECK (project_id IS NOT NULL AND private.is_project_member(project_id));

REVOKE ALL ON TABLE public.nexus_capabilities FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nexus_capabilities TO authenticated;

-- The live providers table has (name, type, metadata), not key/category columns.
-- Store a stable provider key in metadata and reuse existing providers by name.
WITH provider_seed(provider_key, provider_name) AS (
  VALUES
    ('build-ios-apps', 'Build iOS Apps'),
    ('coderabbit', 'CodeRabbit'),
    ('supabase', 'Supabase'),
    ('aictrl-dev', 'aictrl.dev'),
    ('github', 'GitHub'),
    ('linear', 'Linear'),
    ('figma', 'Figma'),
    ('openai-developers', 'OpenAI Developers'),
    ('brainbase-mcp', 'Brainbase MCP'),
    ('strengthcode', 'StrengthCode'),
    ('riqor', 'Riqor'),
    ('kora', 'Kora')
)
INSERT INTO public.providers (name, type, metadata)
SELECT seed.provider_name, 'integration', jsonb_build_object('key', seed.provider_key)
FROM provider_seed AS seed
WHERE NOT EXISTS (
  SELECT 1 FROM public.providers AS existing
  WHERE existing.metadata->>'key' = seed.provider_key
     OR lower(existing.name) = lower(seed.provider_name)
);

WITH provider_seed(provider_key, provider_name) AS (
  VALUES
    ('build-ios-apps', 'Build iOS Apps'),
    ('coderabbit', 'CodeRabbit'),
    ('supabase', 'Supabase'),
    ('aictrl-dev', 'aictrl.dev'),
    ('github', 'GitHub'),
    ('linear', 'Linear'),
    ('figma', 'Figma'),
    ('openai-developers', 'OpenAI Developers'),
    ('brainbase-mcp', 'Brainbase MCP'),
    ('strengthcode', 'StrengthCode'),
    ('riqor', 'Riqor'),
    ('kora', 'Kora')
)
UPDATE public.providers AS existing
SET metadata = existing.metadata || jsonb_build_object('key', seed.provider_key),
    type = COALESCE(existing.type, 'integration')
FROM provider_seed AS seed
WHERE lower(existing.name) = lower(seed.provider_name)
  AND existing.metadata->>'key' IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS providers_metadata_key_uidx
  ON public.providers ((metadata->>'key'))
  WHERE metadata ? 'key';

DO $$
DECLARE
  p_id uuid;
BEGIN

  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'build-ios-apps';

  UPDATE public.nexus_capabilities
  SET
    name = 'iOS SwiftUI',
    description = 'Production SwiftUI architecture, implementation and testing.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'skill.ios-swiftui';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('skill.ios-swiftui', 'iOS SwiftUI', 'Production SwiftUI architecture, implementation and testing.', 'high', 'available', '1.0.0', '["ios","swift","swiftui","kind:skill"]'::jsonb, '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb, '["repo.read","repo.write","build.run","test.run"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'coderabbit';

  UPDATE public.nexus_capabilities
  SET
    name = 'Code Review',
    description = 'Independent correctness, maintainability and security review.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'skill.code-review';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('skill.code-review', 'Code Review', 'Independent correctness, maintainability and security review.', 'low', 'available', '1.0.0', '["review","quality","kind:skill"]'::jsonb, '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb, '["repo.read","review.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'supabase';

  UPDATE public.nexus_capabilities
  SET
    name = 'Supabase Architecture',
    description = 'Database, RLS, Realtime and Edge Function design.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'skill.supabase-architecture';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('skill.supabase-architecture', 'Supabase Architecture', 'Database, RLS, Realtime and Edge Function design.', 'medium', 'available', '1.0.0', '["supabase","postgres","rls","kind:skill"]'::jsonb, '[{"capabilityKey":"integration.supabase","kind":"integration"}]'::jsonb, '["database.read","database.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'aictrl-dev';

  UPDATE public.nexus_capabilities
  SET
    name = 'Workflow Governance',
    description = 'Plan, execute and verify governed multi-step workflows.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'skill.workflow-governance';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('skill.workflow-governance', 'Workflow Governance', 'Plan, execute and verify governed multi-step workflows.', 'high', 'available', '1.0.0', '["workflow","governance","kind:skill"]'::jsonb, '[{"capabilityKey":"tool.linear","kind":"tool"}]'::jsonb, '["workflow.start","workflow.read"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'github';

  UPDATE public.nexus_capabilities
  SET
    name = 'GitHub',
    description = 'Repositories, branches, commits, issues and pull requests.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.github';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.github', 'GitHub', 'Repositories, branches, commits, issues and pull requests.', 'high', 'available', '1.0.0', '["git","github","code","kind:tool"]'::jsonb, '[]'::jsonb, '["repo.read","repo.write","pr.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'linear';

  UPDATE public.nexus_capabilities
  SET
    name = 'Linear',
    description = 'Project, milestone and issue tracking.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.linear';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.linear', 'Linear', 'Project, milestone and issue tracking.', 'medium', 'available', '1.0.0', '["planning","issues","kind:tool"]'::jsonb, '[]'::jsonb, '["issue.read","issue.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'figma';

  UPDATE public.nexus_capabilities
  SET
    name = 'Figma',
    description = 'Design inspection and component integration.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.figma';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.figma', 'Figma', 'Design inspection and component integration.', 'low', 'available', '1.0.0', '["design","ui","kind:tool"]'::jsonb, '[]'::jsonb, '["design.read"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'openai-developers';

  UPDATE public.nexus_capabilities
  SET
    name = 'OpenAI',
    description = 'OpenAI model and agent capabilities.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.openai';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.openai', 'OpenAI', 'OpenAI model and agent capabilities.', 'high', 'available', '1.0.0', '["ai","agents","kind:tool"]'::jsonb, '[]'::jsonb, '["model.invoke"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'brainbase-mcp';

  UPDATE public.nexus_capabilities
  SET
    name = 'Brainbase MCP',
    description = 'Managed agent orchestration and execution.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.brainbase';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.brainbase', 'Brainbase MCP', 'Managed agent orchestration and execution.', 'high', 'available', '1.0.0', '["agents","mcp","kind:tool"]'::jsonb, '[]'::jsonb, '["agent.execute"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'supabase';

  UPDATE public.nexus_capabilities
  SET
    name = 'Supabase',
    description = 'Resonance backend integration.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.supabase';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.supabase', 'Supabase', 'Resonance backend integration.', 'medium', 'available', '1.0.0', '["backend","database","kind:integration"]'::jsonb, '[]'::jsonb, '["database.read","database.write","realtime.subscribe"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'github';

  UPDATE public.nexus_capabilities
  SET
    name = 'GitHub Integration',
    description = 'Source-control integration for Resonance execution.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.github';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.github', 'GitHub Integration', 'Source-control integration for Resonance execution.', 'medium', 'available', '1.0.0', '["git","kind:integration"]'::jsonb, '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb, '["repo.read","repo.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'strengthcode';

  UPDATE public.nexus_capabilities
  SET
    name = 'StrengthCode',
    description = 'Specialized capability provider.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.strengthcode';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.strengthcode', 'StrengthCode', 'Specialized capability provider.', 'low', 'planned', '1.0.0', '["specialized","kind:integration"]'::jsonb, '[]'::jsonb, '[]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'riqor';

  UPDATE public.nexus_capabilities
  SET
    name = 'Riqor',
    description = 'Registered integration capability slot.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.riqor';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.riqor', 'Riqor', 'Registered integration capability slot.', 'low', 'planned', '1.0.0', '["integration","kind:integration"]'::jsonb, '[]'::jsonb, '[]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE metadata->>'key' = 'kora';

  UPDATE public.nexus_capabilities
  SET
    name = 'Kora',
    description = 'Registered integration capability slot.',
    provider_id = COALESCE(provider_id, p_id),
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.kora';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.kora', 'Kora', 'Registered integration capability slot.', 'low', 'planned', '1.0.0', '["integration","kind:integration"]'::jsonb, '[]'::jsonb, '[]'::jsonb, p_id);
  END IF;

END $$;
