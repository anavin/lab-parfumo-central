-- Multi-user auth — mirrors lab-parfumo-next (users / user_sessions / login_attempts).
-- Plain Postgres → works on PGlite (local) and Supabase.

create table if not exists users (
  id                  bigint generated always as identity primary key,
  username            text unique not null,
  password_hash       text not null,
  full_name           text not null,
  role                text not null default 'staff',   -- 'admin' | 'staff'
  is_active           boolean not null default true,
  last_login_at       timestamptz,
  failed_login_count  int not null default 0,
  created_at          timestamptz default now()
);

create table if not exists user_sessions (
  token             text primary key,
  user_id           bigint not null references users(id) on delete cascade,
  last_activity_at  timestamptz not null default now(),
  created_at        timestamptz default now()
);
create index if not exists idx_sessions_user on user_sessions (user_id);

create table if not exists login_attempts (
  id          bigint generated always as identity primary key,
  username    text not null,
  success     boolean not null,
  created_at  timestamptz default now()
);
create index if not exists idx_attempts_user_time on login_attempts (username, created_at);

-- The first admin is bootstrapped at runtime from ADMIN_USERNAME/ADMIN_PASSWORD
-- (see lib/db.ts ensureAdmin) so NO password or hash lives in committed code.
