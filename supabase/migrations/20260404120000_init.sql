-- ============================================================
-- POS Cafe: Complete Supabase schema
-- ============================================================

create extension if not exists pgcrypto;

-- 1. PROFILES
-- Linked to Supabase auth.users for role-based access
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin', 'pos', 'kitchen', 'staff')),
  created_at timestamptz default now()
);

-- 2. PRODUCT CATEGORIES
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  send_to_kitchen boolean not null default true,
  created_at timestamptz default now()
);

-- 3. PRODUCTS
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories(id) on delete restrict,
  name text not null,
  price numeric(10, 2) not null default 0,
  unit text,
  tax numeric(5, 2) not null default 0,
  description text,
  send_to_kitchen boolean,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- 4. PRODUCT VARIANTS
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  attribute text not null,
  value text not null,
  extra_price numeric(10, 2) not null default 0,
  created_at timestamptz default now()
);

-- 5. FLOORS
create table if not exists public.floors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 6. TABLES
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.floors(id) on delete cascade,
  table_number text not null,
  seats integer not null default 2,
  is_active boolean not null default true,
  appointment_resource boolean default false,
  created_at timestamptz default now()
);

-- 7. PAYMENT METHODS
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('cash', 'digital', 'upi')),
  is_enabled boolean not null default true,
  upi_id text,
  created_at timestamptz default now(),
  constraint upi_id_required_for_upi check (
    type != 'upi' or (type = 'upi' and upi_id is not null)
  )
);

-- 8. POS SESSIONS
create table if not exists public.pos_sessions (
  id uuid primary key default gen_random_uuid(),
  responsible_user_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closing_sale_amount numeric(10, 2),
  constraint closed_session_must_have_amount check (
    status != 'closed' or (status = 'closed' and closing_sale_amount is not null)
  )
);

-- 9. ORDERS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial unique not null,
  session_id uuid not null references public.pos_sessions(id) on delete restrict,
  table_id uuid references public.tables(id) on delete set null,
  kitchen_status text not null default 'to_cook'
    check (kitchen_status in ('to_cook', 'preparing', 'completed')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid')),
  payment_method_id uuid references public.payment_methods(id) on delete restrict,
  total_amount numeric(10, 2) not null default 0,
  created_at timestamptz default now()
);

-- 10. ORDER ITEMS
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  price_at_checkout numeric(10, 2) not null,
  is_prepared boolean not null default false,
  created_at timestamptz default now()
);

-- 11. SELF ORDER TOKENS (Optional)
create table if not exists public.self_order_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  session_id uuid not null references public.pos_sessions(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz default now()
);
