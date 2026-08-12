-- Manual per-branch stock adjustments. The new branch-stock model starts each
-- branch at 0 and grows from received requisitions + these admin adjustments, so
-- the shop can enter its real existing stock later. qty is a SIGNED delta
-- (+ = add stock, − = remove) that folds straight into the stock calculation.
create table if not exists stock_adjustments (
  id          bigint generated always as identity primary key,
  branch      text not null,                       -- canonical branch code (CTW, SCS, …)
  product_id  bigint references products(id),
  barcode     text,
  scent       text,
  size        text,
  qty         numeric(12,2) not null default 0,    -- signed delta
  note        text,
  created_by  bigint references users(id),
  created_at  timestamptz default now()
);
create index if not exists idx_stock_adj_branch on stock_adjustments (branch, barcode);
