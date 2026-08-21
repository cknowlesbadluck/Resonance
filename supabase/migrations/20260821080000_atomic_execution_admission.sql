-- Serialize execution admission per project so the durable rate limit is atomic.
-- Replays of an existing idempotency key do not consume another admission slot.
create or replace function public.claim_nexus_execution_request(
  p_project_id uuid,
  p_idempotency_key text,
  p_request_hash text,
  p_window_start timestamptz,
  p_limit integer default 30
)
returns table (
  accepted boolean,
  replay boolean,
  conflict boolean,
  request_hash text,
  response jsonb,
  status text,
  execution_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.nexus_execution_requests%rowtype;
  recent_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_project_id::text));

  select * into existing
  from public.nexus_execution_requests
  where project_id = p_project_id
    and idempotency_key = p_idempotency_key
  for update;

  if found then
    if existing.request_hash <> p_request_hash then
      return query select false, false, true, existing.request_hash, existing.response, existing.status, existing.execution_id;
    end if;
    return query select false, true, false, existing.request_hash, existing.response, existing.status, existing.execution_id;
    return;
  end if;

  select count(*)::integer into recent_count
  from public.nexus_execution_requests
  where project_id = p_project_id
    and created_at >= p_window_start;

  if recent_count >= p_limit then
    return query select false, false, false, null::text, null::jsonb, 'rate_limited'::text, null::uuid;
    return;
  end if;

  insert into public.nexus_execution_requests(project_id, idempotency_key, request_hash, status)
  values (p_project_id, p_idempotency_key, p_request_hash, 'accepted');

  return query select true, false, false, p_request_hash, null::jsonb, 'accepted'::text, null::uuid;
end;
$$;

revoke all on function public.claim_nexus_execution_request(uuid, text, text, timestamptz, integer) from public;
grant execute on function public.claim_nexus_execution_request(uuid, text, text, timestamptz, integer) to service_role;
