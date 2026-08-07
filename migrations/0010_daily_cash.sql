-- Per-salesperson daily cash drawer. Manual figures the POS can't derive:
--   opening  = float carried in (yesterday's closing)
--   deposit  = cash taken to the bank
--   closing  = opening + cash sales − deposit  (becomes tomorrow's opening)
-- Keyed per (day, user); the daily report autosaves here so the float carries forward.
create table if not exists daily_cash (
  entry_date  date   not null,
  created_by  bigint not null references users(id) on delete cascade,
  opening     numeric(12,2) not null default 0,
  deposit     numeric(12,2) not null default 0,
  closing     numeric(12,2) not null default 0,
  updated_at  timestamptz default now(),
  primary key (entry_date, created_by)
);
