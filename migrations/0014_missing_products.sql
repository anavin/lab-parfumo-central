-- Products whose real printed barcode labels were missing from the catalog, so scanning
-- them found nothing. Barcodes/scents/sizes taken from the actual label files; grade + price
-- follow the label folder (EDP / EDP+) and the size price table. Idempotent (skips if the
-- barcode already exists). Prices are the standard per-size defaults — adjust if needed.
insert into products (barcode, scent, grade, size, brand, price) values
  ('8857128012136','Argentum','EDP','10 ml.','Lab Parfumo',450),
  ('8857128012135','Argentum','EDP','30 ml.','Lab Parfumo',1290),
  ('8857128012137','Argentum','EDP','4 ml.','Lab Parfumo',179),
  ('8857128012138','Rose Oud','EDP','10 ml.','Lab Parfumo',450),
  ('8857128012139','Rose Oud','EDP','4 ml.','Lab Parfumo',179),
  ('8857128012099','Suite','EDP','10 ml.','Lab Parfumo',450),
  ('8857128012176','White Velour','EDP','10 ml.','Lab Parfumo',450),
  ('8857128012175','White Velour','EDP','30 ml.','Lab Parfumo',1290),
  ('8857128012177','White Velour','EDP','4 ml.','Lab Parfumo',179),
  ('8857128011553','White Velour','EDP','50 ml.','Lab Parfumo',1890),
  ('8857128011775','Buoyant','EDP','50 ml.','Lab Parfumo',1890),
  ('8857128012152','Amber Spangle','EDP+','4 ml.','Lab Parfumo',270)
on conflict (barcode) do nothing;
