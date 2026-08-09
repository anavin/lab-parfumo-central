-- Bank-deposit slip photos attached to a day's shop-cash record (admin /cash page).
-- Stored as client-compressed data-URL text so it works on PGlite (local) and Supabase.
create table if not exists cash_attachments (
  id          bigint generated always as identity primary key,
  entry_date  date   not null,
  created_by  bigint references users(id),
  data        text   not null,                 -- 'data:image/jpeg;base64,...'
  created_at  timestamptz default now()
);
create index if not exists idx_cash_attach_date on cash_attachments (entry_date);
