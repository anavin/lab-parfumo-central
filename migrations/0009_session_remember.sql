-- "Remember me" sessions skip the idle auto-logout and get a long-lived cookie.
alter table user_sessions add column if not exists remember boolean not null default false;
