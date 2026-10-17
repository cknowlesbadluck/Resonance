-- Shared leases for cross-instance fair share and rate limits.
-- OWNER APPLIES: this migration is NOT applied by CI or by the PR that adds it.
--
-- One row per held slot. A slot is (scope, key), e.g. ('project', '<uuid>') or ('adapter', 'github').
-- nexus_lease_acquire() admits at most p_limit unexpired rows per (scope, key) under a
-- transaction-scoped advisory lock on that slot, so concurrent acquirers cannot overshoot.
-- Expired rows are swept on every acquire for that slot. A crashed instance's leases simply time
-- out (TTL), so nothing is held forever. Callers release explicitly on completion.
--
-- Access: RLS enabled with no policies and privileges revoked from anon/authenticated.
-- Only the service role (server-side) reads/writes, and only via the two functions.

create table if not exists public.nexus_fair_share_leases (
  lease_id    uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('project', 'adapter', 'rate')),
  key         text not null check (char_length(key) between 1 and 200),
  holder      text not null check (char_length(holder) between 1 and 200),
  acquired_at timestamptz not null default now(),
  expires_at  timestamptz not null
);

create index if not exists nexus_fair_share_leases_slot_idx
  on public.nexus_fair_share_leases (scope, key, expires_at);

alter table public.nexus_fair_share_leases enable row level security;
revoke all on table public.nexus_fair_share_leases from anon, authenticated;

-- Returns the new lease id, or NULL when the slot is at capacity. Never waits on capacity.
create or replace function public.nexus_lease_acquire(
  p_scope text,
  p_key text,
  p_limit integer,
  p_holder text,
  p_ttl_seconds integer
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
  v_id uuid;
begin
  if p_scope is null or p_scope not in ('project', 'adapter', 'rate')
     or p_key is null or char_length(p_key) not between 1 and 200
     or p_holder is null or char_length(p_holder) not between 1 and 200
     or p_limit is null or p_limit < 1 or p_limit > 1024
     or p_ttl_seconds is null or p_ttl_seconds < 1 or p_ttl_seconds > 3600 then
    raise exception 'nexus_lease_acquire: invalid arguments' using errcode = '22023';
  end if;

  -- Serialise acquirers of this one slot only (other slots proceed in parallel).
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_scope || ':' || p_key, 0));

  delete from public.nexus_fair_share_leases
   where scope = p_scope and key = p_key and expires_at <= pg_catalog.now();

  select count(*) into v_count
    from public.nexus_fair_share_leases
   where scope = p_scope and key = p_key;

  if v_count >= p_limit then
    return null;
  end if;

  insert into public.nexus_fair_share_leases (scope, key, holder, expires_at)
  values (p_scope, p_key, p_holder, pg_catalog.now() + pg_catalog.make_interval(secs => p_ttl_seconds))
  returning lease_id into v_id;

  return v_id;
end;
$$;

-- Idempotent: releasing an unknown or already-expired lease returns false.
create or replace function public.nexus_lease_release(p_lease_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.nexus_fair_share_leases where lease_id = p_lease_id;
  return found;
end;
$$;

revoke all on function public.nexus_lease_acquire(text, text, integer, text, integer) from public, anon, authenticated;
revoke all on function public.nexus_lease_release(uuid) from public, anon, authenticated;
grant execute on function public.nexus_lease_acquire(text, text, integer, text, integer) to service_role;
grant execute on function public.nexus_lease_release(uuid) to service_role;
grant select, insert, delete on table public.nexus_fair_share_leases to service_role;
