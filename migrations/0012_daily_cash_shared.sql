-- Convert daily_cash from per-(day,user) to a single shared per-day drawer.
-- Idempotent: only runs while the old `created_by` column still exists (so it's a
-- no-op on a fresh DB where 0010 already created the per-day shape).
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'daily_cash' and column_name = 'created_by') then
    -- keep one row per day: the most-recently updated
    delete from daily_cash a using daily_cash b
      where a.entry_date = b.entry_date
        and (coalesce(a.updated_at, 'epoch'::timestamptz), a.created_by)
          < (coalesce(b.updated_at, 'epoch'::timestamptz), b.created_by);
    alter table daily_cash drop constraint if exists daily_cash_pkey;
    alter table daily_cash drop constraint if exists daily_cash_created_by_fkey;
    alter table daily_cash rename column created_by to updated_by;
    alter table daily_cash alter column updated_by drop not null;
    alter table daily_cash add primary key (entry_date);
    alter table daily_cash add constraint daily_cash_updated_by_fkey
      foreign key (updated_by) references users(id) on delete set null;
  end if;
end $$;
