-- CHR-51 Option A: `executing` is the exclusive in-flight claim state.
-- Widening the check is safe for existing rows (all current values remain valid).
-- NOT VALID skips the table scan; VALIDATE takes SHARE UPDATE EXCLUSIVE.
alter table public.nexus_execution_requests
drop constraint if exists nexus_execution_requests_status_check;

alter table public.nexus_execution_requests
add constraint nexus_execution_requests_status_check
check (status in ('accepted','executing','completed','failed','waiting','cancelled'))
not valid;

alter table public.nexus_execution_requests
validate constraint nexus_execution_requests_status_check;
