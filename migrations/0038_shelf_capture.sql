-- Fresh ground-truth capture from the branch shelf: one row per physical bottle, scanning BOTH its
-- product barcode and its SKU sticker. A clean dataset collected independently of sku_units, used to
-- compare against the system (find mismatched stickers, missing/extra units) without touching the
-- live data. Idempotent.
create table if not exists shelf_capture (
  id           bigserial primary key,
  branch       text not null,
  barcode      text,
  sku          text not null,
  scent        text,
  size         text,
  captured_by  integer,
  captured_at  timestamptz not null default now()
);
create index if not exists shelf_capture_branch_idx on shelf_capture (branch, captured_at desc);
create index if not exists shelf_capture_sku_idx on shelf_capture (sku);
