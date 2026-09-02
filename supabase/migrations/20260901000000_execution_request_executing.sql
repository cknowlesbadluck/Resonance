-- Allow 'executing' status to prevent concurrent execution on resume route claim
alter table public.nexus_execution_requests
drop constraint if exists nexus_execution_requests_status_check;

-- NOT VALID skips the initial table scan.
alter table public.nexus_execution_requests
add constraint nexus_execution_requests_status_check
check (status in ('accepted','completed','failed','waiting','cancelled','executing'))
not valid;
