-- Track which count lines the salesperson physically verified (typed/scanned) vs left at
-- the pre-filled system quantity. Lets the admin trust a count ("ยืนยันเอง 45/212") and
-- powers the blind-count mode. Idempotent — run by hand on Supabase.
alter table stock_count_lines add column if not exists verified boolean not null default false;
