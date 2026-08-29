-- End-of-day cash reconciliation: the owner physically counts the drawer and records
-- the counted amount. Over/short = counted_cash − closing (the expected cash on hand).
-- Null = not yet counted. Idempotent — run by hand on Supabase.
alter table daily_cash add column if not exists counted_cash numeric;
