-- Row level security for POS Cafe tables

-- Always enable RLS so policies are enforced in Supabase.
alter table public.profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.floors enable row level security;
alter table public.tables enable row level security;
alter table public.payment_methods enable row level security;
alter table public.pos_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.self_order_tokens enable row level security;

-- Profiles: allow users to read their own profile and admins to manage
create policy if not exists profiles_select_self on public.profiles
  for select using (auth.uid() = id);

create policy if not exists profiles_insert_admin on public.profiles
  for insert with check (auth.role() = 'authenticated');

create policy if not exists profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy if not exists profiles_delete_self on public.profiles
  for delete using (auth.uid() = id);

-- Products and categories: read to authenticated users, writes via service role
create policy if not exists product_categories_select_authenticated on public.product_categories
  for select using (auth.role() = 'authenticated');

create policy if not exists products_select_authenticated on public.products
  for select using (auth.role() = 'authenticated');

create policy if not exists product_variants_select_authenticated on public.product_variants
  for select using (auth.role() = 'authenticated');

create policy if not exists products_insert_service on public.products
  for insert with check (auth.role() = 'service_role');

create policy if not exists product_variants_insert_service on public.product_variants
  for insert with check (auth.role() = 'service_role');

-- Sessions/orders: restrict by profile id or allow service role
create policy if not exists pos_sessions_select_owner on public.pos_sessions
  for select using (auth.role() = 'service_role' OR responsible_user_id = auth.uid());

create policy if not exists pos_sessions_insert_service on public.pos_sessions
  for insert with check (auth.role() = 'service_role');

create policy if not exists orders_select_owner on public.orders
  for select using (auth.role() = 'service_role' OR session_id in (select id from public.pos_sessions where responsible_user_id = auth.uid()));

create policy if not exists orders_insert_service on public.orders
  for insert with check (auth.role() = 'service_role');

create policy if not exists order_items_select_owner on public.order_items
  for select using (auth.role() = 'service_role' OR order_id in (select id from public.orders where session_id in (select id from public.pos_sessions where responsible_user_id = auth.uid())));

create policy if not exists order_items_insert_service on public.order_items
  for insert with check (auth.role() = 'service_role');

-- Self order tokens: only service role creates tokens
create policy if not exists self_order_tokens_insert_service on public.self_order_tokens
  for insert with check (auth.role() = 'service_role');

create policy if not exists self_order_tokens_select_service on public.self_order_tokens
  for select using (auth.role() = 'service_role');
