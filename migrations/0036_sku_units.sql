-- Serialized per-unit (SKU) tracking. Each physical bottle the warehouse (stockflow) ships
-- carries a unique SKU serial, delivered in purchase_orders.shipped_skus. On receiving, each SKU
-- is recorded here as in_stock at the branch. At sale time (phase 3) the matching SKU flips to
-- sold and links to the bill — so we know which unit went where, which remain, and which went
-- missing. Idempotent.
create table if not exists sku_units (
  sku                 text primary key,
  barcode             text,
  scent               text,
  size                text,
  branch              text not null,
  po_id               integer,
  po_number           text,
  received_at         timestamptz not null default now(),
  received_by         integer,
  status              text not null default 'in_stock',   -- in_stock | sold | returned
  sold_at             timestamptz,
  sold_submission_id  integer,
  sold_sale_id        integer,
  sold_receipt_no     text,
  sold_branch         text
);
create index if not exists sku_units_barcode_branch_idx on sku_units (barcode, branch);
create index if not exists sku_units_status_idx on sku_units (status);
create index if not exists sku_units_po_idx on sku_units (po_id);
