-- The per-piece serial SKUs the central warehouse (stockflow) shipped with a requisition,
-- stored as JSON [{sku, product, size, barcode}] so the branch can check them on screen at
-- receiving time (no printing). Populated by /api/inbound/requisition. Idempotent.
alter table purchase_orders add column if not exists shipped_skus jsonb;
