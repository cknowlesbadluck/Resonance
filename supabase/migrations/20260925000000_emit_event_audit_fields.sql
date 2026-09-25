-- Update emit_event RPC to support id, actor_id, and created_at fields
create or replace function public.emit_event(
  p_project_id uuid,
  p_source text,
  p_type text,
  p_status text,
  p_correlation_id text default null,
  p_resource_type text default null,
  p_resource_id text default null,
  p_external_id text default null,
  p_payload jsonb default '{}'::jsonb,
  p_id uuid default null,
  p_actor_id uuid default null,
  p_created_at timestamptz default null
) returns public.events
language plpgsql
security invoker
as $$
declare
  v_event public.events;
  v_id uuid := coalesce(p_id, gen_random_uuid());
  v_created_at timestamptz := coalesce(p_created_at, now());
begin
  insert into public.events(id, project_id, source, type, status, correlation_id, actor_id, resource_type, resource_id, external_id, payload, created_at, updated_at)
  values (v_id, p_project_id, p_source, p_type, p_status, p_correlation_id, p_actor_id, p_resource_type, p_resource_id, p_external_id, coalesce(p_payload, '{}'::jsonb), v_created_at, v_created_at)
  on conflict (project_id, source, external_id) where external_id is not null
  do update set
    status = p_status,
    payload = coalesce(p_payload, '{}'::jsonb),
    updated_at = now()
  returning * into v_event;
  return v_event;
end;
$$;
