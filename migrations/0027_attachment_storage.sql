-- Move attachment images from base64 (the `data` column) into Supabase Storage.
-- storage_path holds the Storage object key ("bill/123.jpg"); once a row is moved,
-- its `data` is set to NULL — so `data` must become nullable.
-- The app tolerates this column being absent (falls back to base64), so it can be
-- deployed before this runs; run it before the migration script.
alter table bill_attachments add column if not exists storage_path text;
alter table cash_attachments add column if not exists storage_path text;
alter table po_attachments  add column if not exists storage_path text;

alter table bill_attachments alter column data drop not null;
alter table cash_attachments alter column data drop not null;
alter table po_attachments  alter column data drop not null;
