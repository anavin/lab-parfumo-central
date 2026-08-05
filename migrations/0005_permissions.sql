-- Fine-grained per-menu permissions.
-- `role` stays free text but now supports more presets:
--   admin | manager | operations | viewer | staff
-- `permissions` is an optional per-user override (array of permission keys).
--   NULL  -> inherit the role preset (see lib/auth/permissions.ts)
--   set   -> use exactly these keys (custom access)
alter table users add column if not exists permissions text[];
