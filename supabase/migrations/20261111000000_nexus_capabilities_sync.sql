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

insert into public.providers (key, name, category) values ('build-ios-apps', 'Build iOS Apps', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('coderabbit', 'CodeRabbit', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('supabase', 'Supabase', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('aictrl-dev', 'aictrl.dev', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('github', 'GitHub', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('linear', 'Linear', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('figma', 'Figma', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('openai-developers', 'OpenAI Developers', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('brainbase-mcp', 'Brainbase MCP', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('strengthcode', 'StrengthCode', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('riqor', 'Riqor', 'integration') on conflict (key) do update set name = excluded.name;
insert into public.providers (key, name, category) values ('kora', 'Kora', 'integration') on conflict (key) do update set name = excluded.name;

DO $$
DECLARE
  p_id uuid;
BEGIN

  SELECT id INTO p_id FROM public.providers WHERE key = 'build-ios-apps';

  UPDATE public.nexus_capabilities
  SET
    name = 'iOS SwiftUI',
    description = 'Production SwiftUI architecture, implementation and testing.',
    risk = 'high',
    availability = 'available',
    version = '1.0.0',
    tags = '["ios","swift","swiftui","kind:skill"]'::jsonb,
    dependencies = '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb,
    required_permissions = '["repo.read","repo.write","build.run","test.run"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'skill.ios-swiftui';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('skill.ios-swiftui', 'iOS SwiftUI', 'Production SwiftUI architecture, implementation and testing.', 'high', 'available', '1.0.0', '["ios","swift","swiftui","kind:skill"]'::jsonb, '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb, '["repo.read","repo.write","build.run","test.run"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'coderabbit';

  UPDATE public.nexus_capabilities
  SET
    name = 'Code Review',
    description = 'Independent correctness, maintainability and security review.',
    risk = 'low',
    availability = 'available',
    version = '1.0.0',
    tags = '["review","quality","kind:skill"]'::jsonb,
    dependencies = '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb,
    required_permissions = '["repo.read","review.write"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'skill.code-review';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('skill.code-review', 'Code Review', 'Independent correctness, maintainability and security review.', 'low', 'available', '1.0.0', '["review","quality","kind:skill"]'::jsonb, '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb, '["repo.read","review.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'supabase';

  UPDATE public.nexus_capabilities
  SET
    name = 'Supabase Architecture',
    description = 'Database, RLS, Realtime and Edge Function design.',
    risk = 'medium',
    availability = 'available',
    version = '1.0.0',
    tags = '["supabase","postgres","rls","kind:skill"]'::jsonb,
    dependencies = '[{"capabilityKey":"integration.supabase","kind":"integration"}]'::jsonb,
    required_permissions = '["database.read","database.write"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'skill.supabase-architecture';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('skill.supabase-architecture', 'Supabase Architecture', 'Database, RLS, Realtime and Edge Function design.', 'medium', 'available', '1.0.0', '["supabase","postgres","rls","kind:skill"]'::jsonb, '[{"capabilityKey":"integration.supabase","kind":"integration"}]'::jsonb, '["database.read","database.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'aictrl-dev';

  UPDATE public.nexus_capabilities
  SET
    name = 'Workflow Governance',
    description = 'Plan, execute and verify governed multi-step work.',
    risk = 'high',
    availability = 'available',
    version = '1.0.0',
    tags = '["workflow","governance","kind:skill"]'::jsonb,
    dependencies = '[{"capabilityKey":"tool.linear","kind":"tool"}]'::jsonb,
    required_permissions = '["workflow.start","workflow.read"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'skill.workflow-governance';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('skill.workflow-governance', 'Workflow Governance', 'Plan, execute and verify governed multi-step work.', 'high', 'available', '1.0.0', '["workflow","governance","kind:skill"]'::jsonb, '[{"capabilityKey":"tool.linear","kind":"tool"}]'::jsonb, '["workflow.start","workflow.read"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'github';

  UPDATE public.nexus_capabilities
  SET
    name = 'GitHub',
    description = 'Repositories, branches, commits, issues and pull requests.',
    risk = 'high',
    availability = 'available',
    version = '1.0.0',
    tags = '["git","github","code","kind:tool"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '["repo.read","repo.write","pr.write"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.github';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.github', 'GitHub', 'Repositories, branches, commits, issues and pull requests.', 'high', 'available', '1.0.0', '["git","github","code","kind:tool"]'::jsonb, '[]'::jsonb, '["repo.read","repo.write","pr.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'linear';

  UPDATE public.nexus_capabilities
  SET
    name = 'Linear',
    description = 'Project, milestone and issue tracking.',
    risk = 'medium',
    availability = 'available',
    version = '1.0.0',
    tags = '["planning","issues","kind:tool"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '["issue.read","issue.write"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.linear';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.linear', 'Linear', 'Project, milestone and issue tracking.', 'medium', 'available', '1.0.0', '["planning","issues","kind:tool"]'::jsonb, '[]'::jsonb, '["issue.read","issue.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'figma';

  UPDATE public.nexus_capabilities
  SET
    name = 'Figma',
    description = 'Design inspection and component integration.',
    risk = 'low',
    availability = 'available',
    version = '1.0.0',
    tags = '["design","ui","kind:tool"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '["design.read"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.figma';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.figma', 'Figma', 'Design inspection and component integration.', 'low', 'available', '1.0.0', '["design","ui","kind:tool"]'::jsonb, '[]'::jsonb, '["design.read"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'openai-developers';

  UPDATE public.nexus_capabilities
  SET
    name = 'OpenAI',
    description = 'OpenAI model and agent capabilities.',
    risk = 'high',
    availability = 'available',
    version = '1.0.0',
    tags = '["ai","agents","kind:tool"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '["model.invoke"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.openai';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.openai', 'OpenAI', 'OpenAI model and agent capabilities.', 'high', 'available', '1.0.0', '["ai","agents","kind:tool"]'::jsonb, '[]'::jsonb, '["model.invoke"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'brainbase-mcp';

  UPDATE public.nexus_capabilities
  SET
    name = 'Brainbase MCP',
    description = 'Managed agent orchestration and execution.',
    risk = 'high',
    availability = 'available',
    version = '1.0.0',
    tags = '["agents","mcp","kind:tool"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '["agent.execute"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'tool.brainbase';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('tool.brainbase', 'Brainbase MCP', 'Managed agent orchestration and execution.', 'high', 'available', '1.0.0', '["agents","mcp","kind:tool"]'::jsonb, '[]'::jsonb, '["agent.execute"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'supabase';

  UPDATE public.nexus_capabilities
  SET
    name = 'Supabase',
    description = 'Resonance backend integration.',
    risk = 'medium',
    availability = 'available',
    version = '1.0.0',
    tags = '["backend","database","kind:integration"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '["database.read","database.write","realtime.subscribe"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.supabase';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.supabase', 'Supabase', 'Resonance backend integration.', 'medium', 'available', '1.0.0', '["backend","database","kind:integration"]'::jsonb, '[]'::jsonb, '["database.read","database.write","realtime.subscribe"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'github';

  UPDATE public.nexus_capabilities
  SET
    name = 'GitHub Integration',
    description = 'Source-control integration for Resonance execution.',
    risk = 'medium',
    availability = 'available',
    version = '1.0.0',
    tags = '["git","kind:integration"]'::jsonb,
    dependencies = '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb,
    required_permissions = '["repo.read","repo.write"]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.github';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.github', 'GitHub Integration', 'Source-control integration for Resonance execution.', 'medium', 'available', '1.0.0', '["git","kind:integration"]'::jsonb, '[{"capabilityKey":"tool.github","kind":"tool"}]'::jsonb, '["repo.read","repo.write"]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'strengthcode';

  UPDATE public.nexus_capabilities
  SET
    name = 'StrengthCode',
    description = 'Specialized capability provider.',
    risk = 'low',
    availability = 'planned',
    version = '1.0.0',
    tags = '["specialized","kind:integration"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '[]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.strengthcode';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.strengthcode', 'StrengthCode', 'Specialized capability provider.', 'low', 'planned', '1.0.0', '["specialized","kind:integration"]'::jsonb, '[]'::jsonb, '[]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'riqor';

  UPDATE public.nexus_capabilities
  SET
    name = 'Riqor',
    description = 'Registered integration capability slot.',
    risk = 'low',
    availability = 'planned',
    version = '1.0.0',
    tags = '["integration","kind:integration"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '[]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.riqor';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.riqor', 'Riqor', 'Registered integration capability slot.', 'low', 'planned', '1.0.0', '["integration","kind:integration"]'::jsonb, '[]'::jsonb, '[]'::jsonb, p_id);
  END IF;


  SELECT id INTO p_id FROM public.providers WHERE key = 'kora';

  UPDATE public.nexus_capabilities
  SET
    name = 'Kora',
    description = 'Registered integration capability slot.',
    risk = 'low',
    availability = 'planned',
    version = '1.0.0',
    tags = '["integration","kind:integration"]'::jsonb,
    dependencies = '[]'::jsonb,
    required_permissions = '[]'::jsonb,
    provider_id = p_id,
    updated_at = now()
  WHERE project_id IS NULL AND capability_key = 'integration.kora';

  IF NOT FOUND THEN
    INSERT INTO public.nexus_capabilities (capability_key, name, description, risk, availability, version, tags, dependencies, required_permissions, provider_id)
    VALUES ('integration.kora', 'Kora', 'Registered integration capability slot.', 'low', 'planned', '1.0.0', '["integration","kind:integration"]'::jsonb, '[]'::jsonb, '[]'::jsonb, p_id);
  END IF;

END $$;
