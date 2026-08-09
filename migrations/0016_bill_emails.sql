-- Customer emails captured when a receipt is emailed from the receipt page.
-- One row per send (keeps a history + a collectable email list for marketing).
create table if not exists bill_emails (
  id          bigint generated always as identity primary key,
  bill_ref    text   not null,
  email       text   not null,
  lang        text,
  sent_by     bigint references users(id),
  sent_at     timestamptz default now()
);
create index if not exists idx_bill_emails_ref   on bill_emails (bill_ref);
create index if not exists idx_bill_emails_email on bill_emails (lower(email));
