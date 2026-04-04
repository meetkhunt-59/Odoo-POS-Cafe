-- Initial schema for POS Cafe auth + shifts.

create table if not exists public.users (
  id bigserial primary key,
  username varchar(64) not null unique,
  email varchar(320) unique,
  password_hash text not null,
  role text not null check (role in ('admin', 'pos', 'kitchen')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists users_role_idx on public.users (role);

create table if not exists public.shifts (
  id bigserial primary key,
  user_id bigint not null references public.users(id) on delete cascade,
  name varchar(64) not null,
  start_time time not null,
  end_time time not null,
  days_mask integer not null default 127 check (days_mask >= 0 and days_mask <= 127),
  timezone varchar(64),
  is_active boolean not null default true,
  constraint uq_shift_user_name unique (user_id, name)
);

create index if not exists shifts_user_id_idx on public.shifts (user_id);

