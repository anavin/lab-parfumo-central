-- Audit flag for a SKU that is marked 'sold' but was physically found on the shelf during a
-- stock collection/count. Lets managers follow up (wrong bill / return / miscount / item came
-- back). Set when such a SKU is scanned in เก็บ SKU; cleared when the unit is returned to stock
-- or the flag is dismissed. Idempotent.
alter table sku_units add column if not exists shelf_flag_at timestamptz;
alter table sku_units add column if not exists shelf_flag_by integer;
create index if not exists sku_units_shelf_flag_idx on sku_units (shelf_flag_at) where shelf_flag_at is not null;
