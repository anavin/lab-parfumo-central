-- Make approval idempotent: link each live row back to the submission it came
-- from, with a UNIQUE index so re-running an approval (retry / double-click /
-- concurrent admins) can ON CONFLICT DO NOTHING instead of inserting a duplicate
-- (which would double-count revenue). NULLs are allowed and distinct, so legacy
-- Excel-imported rows (submission_id NULL) are unaffected.
alter table sales           add column if not exists submission_id bigint;
alter table daily_customers add column if not exists submission_id bigint;
create unique index if not exists uq_sales_submission           on sales (submission_id);
create unique index if not exists uq_daily_customers_submission on daily_customers (submission_id);
