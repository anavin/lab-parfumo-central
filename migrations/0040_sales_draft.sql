-- ยอดขาย CTW (ฉบับร่าง): สำเนายอดขายรายเดือนไว้ "แก้/จำลอง" อย่างอิสระ
-- เป็นชุดข้อมูลแยก ไม่กระทบ sales / submissions / sku_units จริงเลย
-- ไม่ใช่ยอดขายจริง — ใช้ดู/วางแผนภายในเท่านั้น
create table if not exists sales_draft (
  id              bigserial primary key,
  draft_month     text not null,           -- 'YYYY-MM' (เดือนที่ snapshot)
  source          text,                    -- รหัสสาขา (CTW/SCS/EVENT_SCS) ตามต้นฉบับ
  receipt_no      text,
  sale_date       date,
  sale_time       time,
  ba              text,
  item            text,
  barcode         text,
  size            text,
  qty             numeric not null default 0,
  unit_price      numeric not null default 0,
  discount        numeric not null default 0,
  total           numeric not null default 0,
  payment_channel text,
  nation          text,
  src_sales_id    bigint,                  -- อ้างอิง sales.id ที่ copy มา (ไม่ผูก FK กันลบ)
  created_at      timestamptz not null default now()
);
create index if not exists sales_draft_month_idx   on sales_draft (draft_month, source);
create index if not exists sales_draft_receipt_idx on sales_draft (receipt_no);
