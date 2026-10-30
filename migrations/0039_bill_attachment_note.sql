-- Tag bill photos so a SKU-fallback photo (sticker that wouldn't scan at the counter) is
-- distinguishable from a payment slip. note format:
--   'sku|<barcode>|<item>'   = SKU photo waiting to be read & cut from stock on /review
--   'skudone|<sku>'          = already resolved (serial marked sold)
-- NULL / anything else       = ordinary slip photo
alter table bill_attachments add column if not exists note text;
create index if not exists idx_bill_attach_sku on bill_attachments (bill_ref) where note like 'sku|%';
