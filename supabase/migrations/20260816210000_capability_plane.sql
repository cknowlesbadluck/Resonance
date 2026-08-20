create table if not exists public.capabilities (
  id text primary key,
  name text not null,
  description text not null default '',
  kind text not null check (kind in ('skill','tool','integration')),
  provider text not null,
  version text not null default '1.0.0',
  status text not null default 'planned' check (status in ('available','degraded','unavailable','planned')),
  permissions jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.capability_dependencies (
  capability_id text not null references public.capabilities(id) on delete cascade,
  dependency_id text not null references public.capabilities(id) on delete cascade,
  optional boolean not null default false,
  primary key (capability_id, dependency_id)
);

create index if not exists capabilities_kind_idx on public.capabilities(kind);
create index if not exists capabilities_status_idx on public.capabilities(status);

alter table public.capabilities enable row level security;
alter table public.capability_dependencies enable row level security;

create policy "authenticated users can read capabilities"
  on public.capabilities for select to authenticated using (true);

create policy "authenticated users can read capability dependencies"
  on public.capability_dependencies for select to authenticated using (true);

insert into public.capabilities (id, name, description, kind, provider, status, permissions, tags)
values
('skill.ios-swiftui','iOS SwiftUI','Production SwiftUI architecture, implementation and testing.','skill','Build iOS Apps','available','["repo.read","repo.write","build.run","test.run"]','["ios","swift","swiftui"]'),
('skill.code-review','Code Review','Independent correctness, maintainability and security review.','skill','CodeRabbit','available','["repo.read","review.write"]','["review","quality"]'),
('skill.supabase-architecture','Supabase Architecture','Database, RLS, Realtime and Edge Function design.','skill','Supabase','available','["database.read","database.write"]','["supabase","postgres","rls"]'),
('skill.workflow-governance','Workflow Governance','Plan, execute and verify governed multi-step work.','skill','aictrl.dev','available','["workflow.start","workflow.read"]','["workflow","governance"]'),
('tool.github','GitHub','Repositories, branches, commits, issues and pull requests.','tool','GitHub','available','["repo.read","repo.write","pr.write"]','["git","github","code"]'),
('tool.linear','Linear','Project, milestone and issue tracking.','tool','Linear','available','["issue.read","issue.write"]','["planning","issues"]'),
('tool.figma','Figma','Design inspection and component integration.','tool','Figma','available','["design.read"]','["design","ui"]'),
('tool.openai','OpenAI','OpenAI model and agent capabilities.','tool','OpenAI Developers','available','["model.invoke"]','["ai","agents"]'),
('tool.brainbase','Brainbase MCP','Managed agent orchestration and execution.','tool','Brainbase MCP','available','["agent.execute"]','["agents","mcp"]'),
('integration.supabase','Supabase','Resonance backend integration.','integration','Supabase','available','["database.read","database.write","realtime.subscribe"]','["backend","database"]'),
('integration.github','GitHub Integration','Source-control integration for Resonance execution.','integration','GitHub','available','["repo.read","repo.write"]','["git"]'),
('integration.strengthcode','StrengthCode','Specialized capability provider.','integration','StrengthCode','planned','[]','["specialized"]'),
('integration.riqor','Riqor','Registered integration capability slot.','integration','Riqor','planned','[]','["integration"]'),
('integration.kora','Kora','Registered integration capability slot.','integration','Kora','planned','[]','["integration"]')
on conflict (id) do update set status = excluded.status, updated_at = now();

insert into public.capability_dependencies (capability_id, dependency_id)
values
('skill.ios-swiftui','tool.github'),
('skill.code-review','tool.github'),
('skill.supabase-architecture','integration.supabase'),
('skill.workflow-governance','tool.linear'),
('integration.github','tool.github')
on conflict do nothing;
