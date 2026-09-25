-- Partial execution is a terminal request state: some steps succeeded and must not be retried.
alter table public.nexus_execution_requests
  drop constraint if exists nexus_execution_requests_status_check;

alter table public.nexus_execution_requests
  add constraint nexus_execution_requests_status_check
  check (status in ('accepted', 'completed', 'failed', 'waiting', 'cancelled', 'partial'));
