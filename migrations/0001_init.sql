-- Lab Parfumo — Central requisition & retail-ops schema
-- Plain PostgreSQL. Runs on PGlite (local dev) and Supabase (prod) unchanged.

create table if not exists branches (
  id            bigint generated always as identity primary key,
  branch_code   text unique not null,          -- '01_CTW - Central World'
  store_code    text,                           -- '01_CTW'
  store_no      text,                           -- 'สาขาที่ 00001' | 'Event'
  tel           text,
  receiver      text,
  email_store   text,
  email_admin   text,
  address       text,
  created_at    timestamptz default now()
);

create table if not exists products (
  id            bigint generated always as identity primary key,
  barcode       text unique not null,
  scent         text not null,
  grade         text,                           -- EDP / EDP+ / PARFUM / EDT ...
  size          text,                           -- '50 ml.' '30 ml.' '10 ml.'
  sku           text,                           -- 'THD-50 ml'
  brand         text default 'Lab Parfumo',
  price         numeric(12,2),
  description   text,
  created_at    timestamptz default now()
);
create index if not exists idx_products_scent on products (scent);

-- ---------------------------------------------------------------- requisitions
-- A purchase order == a requisition (ใบเบิก). Printed as ใบเบิกสินค้า + ใบส่งของ.
create table if not exists purchase_orders (
  id              bigint generated always as identity primary key,
  po_number       text not null,
  version         text,
  order_date      date,
  branch_label    text,                         -- raw label from source
  branch_id       bigint references branches(id),
  store_no        text,
  delivery_number text,
  phone           text,
  shipping_name   text,
  address         text,
  remark          text,
  status          text default 'draft',         -- draft | issued | delivered | closed
  created_at      timestamptz default now(),
  unique (po_number, version)
);
create index if not exists idx_po_date on purchase_orders (order_date);

create table if not exists po_items (
  id          bigint generated always as identity primary key,
  po_id       bigint references purchase_orders(id) on delete cascade,
  line_no     int,
  barcode     text,
  product_id  bigint references products(id),
  scent       text,
  size        text,
  qty         numeric(12,2) default 0
);
create index if not exists idx_po_items_po on po_items (po_id);

-- ----------------------------------------------------------------- logistics
create table if not exists shipment_items (
  id              bigint generated always as identity primary key,
  line_no         int,
  ship_date       date,
  po_number       text,
  po_id           bigint references purchase_orders(id),
  sku             text,
  name            text,
  serial          text,
  grade           text,
  size            text,
  branch_label    text,
  receive_status  text
);
create index if not exists idx_ship_po on shipment_items (po_number);

create table if not exists return_items (
  id              bigint generated always as identity primary key,
  line_no         int,
  return_date     date,
  po_number       text,
  sku             text,
  name            text,
  serial          text,
  grade           text,
  size            text,
  branch_label    text,
  receive_status  text
);

-- ------------------------------------------------------------------- sales
create table if not exists sales (
  id               bigint generated always as identity primary key,
  source           text,                        -- CTW | EVENT_SCS
  month            text,                         -- 'Nov-25'
  sale_date        date,
  sale_time        time,
  ba               text,                         -- beauty advisor(s)
  order_no         text,
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
  paid             numeric(12,2),
  payment_channel  text,
  note             text,
  nation           text                          -- Thai | Foreign | null
);
create index if not exists idx_sales_date on sales (sale_date);
create index if not exists idx_sales_month on sales (month);
create index if not exists idx_sales_barcode on sales (barcode);

create table if not exists daily_customers (
  id             bigint generated always as identity primary key,
  month          text,
  cust_date      date,
  ba             text,
  customers      int default 0,
  sell_amount    numeric(12,2) default 0,
  thai           numeric(12,2),
  thai_sales     numeric(12,2),
  foreign_cnt    numeric(12,2),
  foreign_sales  numeric(12,2)
);
create index if not exists idx_cust_date on daily_customers (cust_date);

create table if not exists product_costs (
  id           bigint generated always as identity primary key,
  cost_date    date,
  scent        text,
  size         text,
  barcode      text,
  unit_cost    numeric(12,2),
  qty          numeric(12,2) default 0,
  total_cost   numeric(12,2)
);

create table if not exists cash_entries (
  id           bigint generated always as identity primary key,
  cash_date    date,
  description  text,
  amount       numeric(12,2),
  type         text
);
create index if not exists idx_cash_date on cash_entries (cash_date);

-- Reference snapshot of stock as it stood in the source workbook.
create table if not exists stock_snapshot (
  id           bigint generated always as identity primary key,
  scent        text,
  size         text,
  barcode      text,
  shipped      numeric(12,2) default 0,
  sold         numeric(12,2) default 0,
  remaining    numeric(12,2) default 0
);
