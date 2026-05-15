-- Congo Gaming — Supabase schema
-- Run in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ENUM type for transaction direction
do $$ begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type transaction_type as enum ('deposit', 'withdrawal');
  end if;
end $$;

-- USERS
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone varchar(20) not null unique,
  pin_hash varchar(64) not null,
  balance_cdf decimal(15,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists users_phone_idx on public.users(phone);

-- TRANSACTIONS
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_id varchar(128) not null unique,
  type transaction_type not null,
  amount decimal(15,2) not null,
  currency varchar(3) not null default 'CDF',
  provider_id integer not null,
  status integer not null default 0,
  transaction_id varchar(100),
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_idx on public.transactions(user_id, created_at desc);
create index if not exists transactions_order_idx on public.transactions(order_id);

-- Atomic balance adjustment (used by withdraw)
create or replace function public.adjust_balance(p_user_id uuid, p_delta numeric)
returns void
language plpgsql
as $$
begin
  update public.users
  set balance_cdf = balance_cdf + p_delta
  where id = p_user_id;
end;
$$;

-- RLS
alter table public.users enable row level security;
alter table public.transactions enable row level security;

-- Allow anon role to register/login by phone (insert + select own row).
-- For production, you should move auth behind a server-side endpoint.
drop policy if exists "users_insert_anon" on public.users;
create policy "users_insert_anon" on public.users
  for insert to anon
  with check (true);

drop policy if exists "users_select_by_phone" on public.users;
create policy "users_select_by_phone" on public.users
  for select to anon
  using (true);

-- Transactions are read/write only via service key (server). No anon policy.

-- LOTO TIRAGES
create table if not exists public.loto_tirages (
  id uuid primary key default gen_random_uuid(),
  numeros integer[] not null,           -- 6 numéros tirés [1-49]
  complementaire integer not null,       -- 1 numéro complémentaire
  jackpot decimal(15,2) not null default 0,
  hash_pre text not null,               -- SHA-256 publié AVANT le tirage
  drawn_at timestamptz not null default now()
);

-- LOTO TICKETS
create table if not exists public.loto_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tirage_id uuid references public.loto_tirages(id) on delete set null,
  numeros integer[] not null,           -- 6 numéros choisis par le joueur
  prix_cdf decimal(15,2) not null default 500,
  gains_cdf decimal(15,2) not null default 0,
  nb_bons integer not null default 0,   -- nombre de numéros corrects
  status text not null default 'pending', -- pending | gagnant | perdant
  created_at timestamptz not null default now()
);

create index if not exists loto_tickets_user_idx on public.loto_tickets(user_id, created_at desc);
create index if not exists loto_tickets_tirage_idx on public.loto_tickets(tirage_id);

-- RLS : lecture/écriture via service key uniquement
alter table public.loto_tirages enable row level security;
alter table public.loto_tickets enable row level security;
