-- Requisition receipt — Phase 3: stock now counts only RECEIVED requisitions
-- (by received_qty) + admin allocations. Grandfather every existing purchase order
-- that already contributed to stock (issued/delivered/closed/…) as 'received' so the
-- current stock numbers don't change. Allocations (จัดสต๊อกสาขา) keep their status
-- and already count; genuine drafts stay draft.
update purchase_orders
   set status = 'received', received_at = coalesce(received_at, now())
 where coalesce(status,'') not in ('received', 'จัดสต๊อกสาขา', 'draft')
   and deleted_at is null;
