-- Approval rejection is a durable terminal state, so the request status enum must represent it.
alter table public.nexus_execution_requests
drop constraint if exists nexus_execution_requests_status_check;

-- NOT VALID skips the initial table scan (and the ACCESS EXCLUSIVE lock it would
-- hold for the duration), so this constraint is added without blocking reads/writes.
-- Existing rows are validated separately by the following migration, which only
-- needs SHARE UPDATE EXCLUSIVE.
alter table public.nexus_execution_requests
add constraint nexus_execution_requests_status_check
check (status in ('accepted','completed','failed','waiting','cancelled'))
not valid;
