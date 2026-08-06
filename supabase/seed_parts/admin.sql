insert into users (username, password_hash, full_name, role)
values ('admin', '$2a$14$Co0KPEdvTM8oy9AYwwyRGus3TAO5ESBE7yCurm7yr2HLpSnQ87vju', 'ผู้ดูแลระบบ', 'admin')
on conflict (username) do update set password_hash = excluded.password_hash;
