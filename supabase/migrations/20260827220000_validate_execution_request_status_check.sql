-- Validates the status check constraint added NOT VALID in
-- 20260822190000_execution_request_cancelled.sql. VALIDATE CONSTRAINT takes
-- SHARE UPDATE EXCLUSIVE, not ACCESS EXCLUSIVE, so this does not block
-- concurrent reads or writes on nexus_execution_requests.
alter table public.nexus_execution_requests
validate constraint nexus_execution_requests_status_check;
