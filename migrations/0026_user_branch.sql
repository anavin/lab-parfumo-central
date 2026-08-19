-- Each user (salesperson) gets a home branch the admin assigns; /my defaults to it, and the
-- person can still switch branch for the day. Null → falls back to the default branch (CTW).
-- Idempotent — run by hand on Supabase (prod doesn't auto-migrate).
alter table users add column if not exists branch text;
