-- Multi-branch: merge the legacy "Event at Seacon" source into the permanent
-- Seacon Square branch. From now on branches are canonical codes: CTW, SCS.
-- (Central World keeps CTW; the old EVENT_SCS rows roll into SCS.)
update sales       set source = 'SCS' where source = 'EVENT_SCS';
update submissions set source = 'SCS' where source = 'EVENT_SCS';

-- speed up per-branch filtering on the sales table
create index if not exists idx_sales_source on sales (source);
