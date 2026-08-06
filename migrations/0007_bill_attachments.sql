-- Per-bill photo evidence (payment slip / other proof) attached by staff.
-- Linked to the bill by bill_ref = submissions.receipt_no (submitBill always
-- stores a ref, real or generated "B..."). Images are stored client-compressed
-- as data-URL text so it works identically on PGlite (local) and Supabase.
create table if not exists bill_attachments (
  id          bigint generated always as identity primary key,
  bill_ref    text   not null,
  created_by  bigint references users(id),
  data        text   not null,                 -- 'data:image/jpeg;base64,...'
  created_at  timestamptz default now()
);
create index if not exists idx_bill_attach_ref on bill_attachments (bill_ref);
