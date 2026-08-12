-- daily_customers gains a branch (`source`) so customer KPIs split by สาขา the same way
-- sales.source does. Existing rows are backfilled to CTW (the only branch before SCS).
-- Idempotent — safe to re-run on Supabase (prod runs migrations by hand).
alter table daily_customers add column if not exists source text;
update daily_customers set source = 'CTW' where source is null;
create index if not exists idx_dc_source on daily_customers (source);
