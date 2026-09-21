drop function if exists public.emit_event(uuid, text, text, text, text, text, text, text, jsonb);

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
  p_actor_id uuid default null,
  p_id uuid default null
) returns public.events
language plpgsql
security invoker
as $$
declare
  v_event public.events;
begin
  insert into public.events(id, project_id, source, type, status, correlation_id, resource_type, resource_id, external_id, payload, actor_id)
  values (coalesce(p_id, gen_random_uuid()), p_project_id, p_source, p_type, p_status, p_correlation_id, p_resource_type, p_resource_id, p_external_id, coalesce(p_payload, '{}'::jsonb), p_actor_id)
  on conflict (project_id, source, external_id) where external_id is not null
  do update set
    status = coalesce(excluded.status, events.status),
    payload = coalesce(excluded.payload, events.payload),
    correlation_id = coalesce(excluded.correlation_id, events.correlation_id),
    resource_type = coalesce(excluded.resource_type, events.resource_type),
    resource_id = coalesce(excluded.resource_id, events.resource_id),
    actor_id = coalesce(excluded.actor_id, events.actor_id),
    updated_at = now()
  returning * into v_event;
  return v_event;
end;
$$;
