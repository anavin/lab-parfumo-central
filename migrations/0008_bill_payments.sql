-- Split tender: a bill paid across 2+ channels (e.g. ฿1,000 cash + ฿690 PromptPay).
-- The sale lines carry payment_channel='จ่าย 2 ทาง' as a marker; the actual amount
-- per channel lives here so the daily cash figure counts only the cash portion.
create table if not exists bill_payments (
  id          bigint generated always as identity primary key,
  bill_ref    text not null,
  created_by  bigint references users(id) on delete set null,
  entry_date  date,
  channel     text not null,
  amount      numeric(12,2) not null default 0,
  created_at  timestamptz default now()
);
create index if not exists idx_bill_payments_ref on bill_payments (bill_ref);
create index if not exists idx_bill_payments_day on bill_payments (created_by, entry_date);
