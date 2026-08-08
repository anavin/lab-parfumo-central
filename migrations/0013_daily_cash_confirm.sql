-- Admin review of the daily shop drawer: confirm the figures and post the bank deposit
-- into the cash ledger once. posted_cash_id links the cash_entries row created on posting
-- (null = not yet posted) so it can never be double-posted.
alter table daily_cash add column if not exists confirmed boolean not null default false;
alter table daily_cash add column if not exists posted_cash_id bigint references cash_entries(id) on delete set null;
