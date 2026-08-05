-- Audit log + soft-delete (ถังขยะ). Mirrors lab-parfumo-next's activity log
-- and deleted_at pattern, generalised to one audit table.

create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  user_id     bigint references users(id) on delete set null,
  user_name   text,
  user_role   text,
  action      text not null,   -- create | update | delete | restore | purge | login | password
  entity      text not null,   -- requisition | sale | cash | customer | shipment | return | user | auth
  entity_id   text,
  detail      text,
  created_at  timestamptz default now()
);
create index if not exists idx_audit_created on audit_log (created_at desc);
create index if not exists idx_audit_entity on audit_log (entity, entity_id);
create index if not exists idx_audit_user on audit_log (user_name);

-- Soft delete for requisitions (the main user-deletable entity).
alter table purchase_orders add column if not exists deleted_at timestamptz;
create index if not exists idx_po_deleted on purchase_orders (deleted_at);
