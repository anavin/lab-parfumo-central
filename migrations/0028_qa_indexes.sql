-- QA audit: indexes for hot paths that had none.
-- STOCK_CTE recomputes returned stock on every stock read, filtering return_items
-- by (serial, receive_status); createReturn now checks (sku, po_number) to dedupe;
-- createReturn / STOCK_CTE also look up shipment_items by (sku, po_number).
create index if not exists idx_return_items_serial on return_items (serial, receive_status);
create index if not exists idx_return_items_sku    on return_items (sku, po_number);
create index if not exists idx_ship_sku            on shipment_items (sku, po_number);
