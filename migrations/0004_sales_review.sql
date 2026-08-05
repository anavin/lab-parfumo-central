-- Staff sales entry with an admin review queue.
-- Staff write to `submissions` (status='pending'); nothing reaches the live
-- `sales` / `daily_customers` tables until an admin approves. On approval the
-- row is copied into the live table with `created_by` preserved, so the
-- dashboard can break sales down by salesperson.

-- who authored a live row (null = legacy data imported from Excel)
alter table sales           add column if not exists created_by bigint references users(id);
alter table daily_customers add column if not exists created_by bigint references users(id);
create index if not exists idx_sales_created_by on sales (created_by);
create index if not exists idx_dc_created_by    on daily_customers (created_by);

create table if not exists submissions (
  id               bigint generated always as identity primary key,
  kind             text   not null,                     -- 'sale' | 'customer'
  status           text   not null default 'pending',   -- pending | approved | rejected
  created_by       bigint not null references users(id),
  ba               text,                                 -- salesperson name (= author full_name)
  entry_date       date   not null,                      -- the working day (sale_date / cust_date)
  -- sale fields ---------------------------------------------------------------
  source           text,
  sale_time        time,
  receipt_no       text,
  item             text,
  barcode          text,
  product_id       bigint references products(id),
  grade            text,
  size             text,
  qty              numeric(12,2) default 0,
  unit_price       numeric(12,2),
  discount         numeric(12,2) default 0,
  total            numeric(12,2),
  payment_channel  text,
  nation           text,
  note             text,
  -- customer-day fields -------------------------------------------------------
  customers        int,
  thai             numeric(12,2),
  foreign_cnt      numeric(12,2),
  sell_amount      numeric(12,2),
  -- review --------------------------------------------------------------------
  reviewed_by      bigint references users(id),
  reviewed_at      timestamptz,
  review_note      text,
  approved_id      bigint,                               -- id in sales/daily_customers once approved
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists idx_sub_status  on submissions (status);
create index if not exists idx_sub_creator on submissions (created_by, entry_date);
create index if not exists idx_sub_pending on submissions (status, created_at);
