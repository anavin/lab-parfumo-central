-- Promotions: a named period with special prices by grade × size (matches the price card).
-- `prices` = jsonb map { "<grade>|<size>": <special price> }, e.g. {"EDP|50 ml.": 1690}.
-- One promo applies at a time (the one whose date range covers today & active); at sale
-- entry the special price auto-fills instead of products.price. Idempotent — run on Supabase.
create table if not exists promotions (
  id          bigint generated always as identity primary key,
  name        text not null,
  start_date  date not null,
  end_date    date not null,
  active      boolean not null default true,
  prices      jsonb not null default '{}',
  created_by  bigint references users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_promotions_window on promotions (active, start_date, end_date);
