-- Multi-branch: each สาขา keeps its own shop-cash drawer per day.
-- Was one shared row per day (PK entry_date); now one row per (day, branch).
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_name = 'daily_cash' and column_name = 'branch') then
    alter table daily_cash add column branch text not null default 'CTW';   -- backfill existing rows to Central World
    alter table daily_cash drop constraint if exists daily_cash_pkey;
    alter table daily_cash add primary key (entry_date, branch);
  end if;
end $$;
