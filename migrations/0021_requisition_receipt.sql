-- Requisition goods-receipt workflow — Phase 1: additive schema only (no behavior
-- change yet). Lifecycle uses purchase_orders.status: draft → approved → received.
alter table purchase_orders add column if not exists approved_at timestamptz;
alter table purchase_orders add column if not exists approved_by bigint references users(id);
alter table purchase_orders add column if not exists received_at timestamptz;
alter table purchase_orders add column if not exists received_by bigint references users(id);

-- per-line goods receipt: quantity actually received + a note when it differs
alter table po_items add column if not exists received_qty numeric(12,2);
alter table po_items add column if not exists line_remark text;

-- files attached to a requisition (packing slip photos, etc.)
create table if not exists po_attachments (
  id          bigint generated always as identity primary key,
  po_id       bigint references purchase_orders(id) on delete cascade,
  data        text not null,                    -- 'data:image/...;base64,...'
  created_by  bigint references users(id),
  created_at  timestamptz default now()
);
create index if not exists idx_po_attach_po on po_attachments (po_id);
