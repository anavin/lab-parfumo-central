-- Multi-branch: bank-deposit slips belong to a (day, branch) drawer.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_name = 'cash_attachments' and column_name = 'branch') then
    alter table cash_attachments add column branch text not null default 'CTW';
    create index if not exists idx_cash_attach_date_branch on cash_attachments (entry_date, branch);
  end if;
end $$;
