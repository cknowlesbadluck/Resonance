-- Validates the status check constraint added NOT VALID in
-- 20260831000000_execution_request_executing.sql.
alter table public.nexus_execution_requests
validate constraint nexus_execution_requests_status_check;
