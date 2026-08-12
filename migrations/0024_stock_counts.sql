-- Salesperson stock count (stocktake). A count is submitted by a salesperson and
-- waits for admin approval; on approval the system posts stock_adjustments for the
-- variances (counted − expected) so branch stock matches what was physically counted.
create table if not exists stock_counts (
  id           bigint generated always as identity primary key,
  branch       text not null,
  status       text not null default 'pending',     -- pending | approved | rejected
  note         text,
  counted_by   bigint references users(id),
  created_at   timestamptz default now(),
  reviewed_by  bigint references users(id),
  reviewed_at  timestamptz,
  review_note  text
);
create table if not exists stock_count_lines (
  id         bigint generated always as identity primary key,
  count_id   bigint references stock_counts(id) on delete cascade,
  barcode    text,
  scent      text,
  size       text,
  expected   numeric(12,2) not null default 0,      -- system stock at submit time
  counted    numeric(12,2) not null default 0       -- physically counted
);
create index if not exists idx_stock_counts_branch on stock_counts (branch, status);
create index if not exists idx_stock_count_lines on stock_count_lines (count_id);
