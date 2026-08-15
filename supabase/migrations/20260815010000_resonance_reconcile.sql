-- Reconcile the original 0001 foundation with the provider-neutral core schema.
-- The core migration intentionally used CREATE TABLE IF NOT EXISTS; this migration makes
-- the evolution explicit so an existing Resonance database receives the newer columns.

alter table public.projects add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.integrations add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.integrations add column if not exists provider_id uuid references public.providers(id) on delete set null;
alter table public.integrations add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.integrations add column if not exists updated_at timestamptz not null default now();
alter table public.workflows add column if not exists slug text;
alter table public.workflows add column if not exists version integer not null default 1;
alter table public.workflow_runs add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.workflow_runs add column if not exists requested_by uuid references auth.users(id) on delete set null;
alter table public.workflow_runs add column if not exists current_step text;
alter table public.workflow_runs add column if not exists completed_at timestamptz;

update public.integrations i
set provider_id = p.id
from public.providers p
where i.provider_id is null and i.provider = p.key;

update public.workflows
set slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
where slug is null or slug = '';

update public.workflow_runs r
set project_id = w.project_id
from public.workflows w
where r.project_id is null and r.workflow_id = w.id;

alter table public.workflows alter column slug set not null;
create unique index if not exists idx_workflows_project_slug on public.workflows(project_id, slug);
create index if not exists idx_workflow_runs_project_created on public.workflow_runs(project_id, created_at desc);
create index if not exists idx_integrations_project on public.integrations(project_id);

-- Keep the legacy provider column for backwards compatibility while new code resolves
-- providers through provider_id.
insert into public.providers (key, name, category) values
  ('github', 'GitHub', 'source_control'),
  ('supabase', 'Supabase', 'backend'),
  ('linear', 'Linear', 'project_management'),
  ('figma', 'Figma', 'design'),
  ('openai', 'OpenAI', 'ai'),
  ('brainbase', 'Brainbase', 'agent_runtime'),
  ('mcp', 'Model Context Protocol', 'tools')
on conflict (key) do nothing;
