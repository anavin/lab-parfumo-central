-- Shared shop cash drawer, ONE row per day (not per user) — the shop has a single
-- physical drawer, so every salesperson sees the same opening float that day:
--   opening  = float carried in (yesterday's closing)
--   deposit  = cash taken to the bank
--   closing  = opening + cash sales − deposit  (becomes tomorrow's opening)
-- The daily report autosaves here so the float carries forward across days & users.
create table if not exists daily_cash (
  entry_date  date primary key,
  opening     numeric(12,2) not null default 0,
  deposit     numeric(12,2) not null default 0,
  closing     numeric(12,2) not null default 0,
  updated_by  bigint references users(id) on delete set null,
  updated_at  timestamptz default now()
);
