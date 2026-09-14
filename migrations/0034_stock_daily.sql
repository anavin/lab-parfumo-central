-- Daily stock snapshot (time series) — one row per (day, branch, barcode) with the
-- remaining qty at snapshot time. Powers the stock-level trend chart and the future
-- "leak without count" detector (remaining drop vs sales). Written nightly by
-- /api/cron/snapshot. Idempotent; the cron upserts today's row. Run by hand on Supabase.
create table if not exists stock_daily (
  snap_date  date not null,
  branch     text not null,
  barcode    text not null,
  scent      text,
  size       text,
  remaining  numeric(12,2) not null default 0,
  primary key (snap_date, branch, barcode)
);
create index if not exists idx_stock_daily on stock_daily (barcode, branch, snap_date);
create index if not exists idx_stock_daily_date on stock_daily (snap_date, branch);
