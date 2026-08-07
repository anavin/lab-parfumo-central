-- Soft-delete for sales submissions: a reviewer can move a bill to the trash
-- ("ถังขยะ") instead of bouncing it back. Trashed bills disappear from the review
-- queue and the salesperson's /my views but can be restored or purged from /trash.
-- (Prod runs this manually — the queries tolerate the column being absent until then.)
alter table submissions add column if not exists deleted_at timestamptz;
create index if not exists idx_sub_alive on submissions (status, created_at) where deleted_at is null;
