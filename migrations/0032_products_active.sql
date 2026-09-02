-- Active flag per product. "ปิดกลิ่น" (on /stock) sets active=false for all sizes of a scent;
-- inactive scents sink to the bottom of the stock matrix (kept, not deleted). Idempotent.
alter table products add column if not exists active boolean not null default true;
