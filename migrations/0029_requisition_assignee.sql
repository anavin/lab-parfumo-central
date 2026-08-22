-- Assign a specific salesperson to receive a requisition. Once assigned, only that
-- person sees it in their /my receiving inbox (pendingReceipts filters by assigned_to).
-- Null = unassigned → shows to no one until an admin assigns it (admins still see all
-- requisitions on /requisitions). Idempotent — run by hand on Supabase.
alter table purchase_orders add column if not exists assigned_to bigint references users(id);
create index if not exists idx_po_assigned on purchase_orders (assigned_to);
