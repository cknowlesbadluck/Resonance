-- CONC-01: fencing token for exclusive execution claim ownership.
-- Allows atomic reclaim of stale "accepted" rows without double-execution.

alter table public.nexus_execution_requests
  add column if not exists claim_token uuid;

create index if not exists idx_nexus_execution_requests_claim
  on public.nexus_execution_requests (project_id, idempotency_key, status, updated_at);

comment on column public.nexus_execution_requests.claim_token is
  'Fencing token set on claim/reclaim. Only the holder of the current token should advance the request.';
