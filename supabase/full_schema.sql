-- ============================================================
-- POS CAFE: UNIFIED DATABASE SCHEMA & RLS POLICIES
-- ============================================================
-- Directions: Copy and paste this entire file into the 
-- Supabase SQL Editor and run it. It is idempotent.
-- ============================================================

-- 0. CLEANUP (Optional: Only if you want a fresh start, uncomment these)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- 1. TABLES DEFINITIONS
-- ============================================================

-- Profiles: Linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point of Sales
CREATE TABLE IF NOT EXISTS public.point_of_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cash_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  upi_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  card_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  send_to_kitchen BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit TEXT,
  tax NUMERIC(5, 2) NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  send_to_kitchen BOOLEAN, -- NULL means inherit from category
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  value TEXT NOT NULL,
  extra_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Floors
CREATE TABLE IF NOT EXISTS public.floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_resource BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'digital', 'upi')),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT upi_id_required_for_upi CHECK (
    type != 'upi' OR (type = 'upi' AND upi_id IS NOT NULL)
  )
);

-- POS Sessions
CREATE TABLE IF NOT EXISTS public.pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsible_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  pos_id UUID REFERENCES public.point_of_sales(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closing_sale_amount NUMERIC(10, 2),
  CONSTRAINT closed_session_must_have_amount CHECK (
    status != 'closed' OR (status = 'closed' AND closing_sale_amount IS NOT NULL)
  )
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE NOT NULL,
  session_id UUID NOT NULL REFERENCES public.pos_sessions(id) ON DELETE RESTRICT,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  kitchen_status TEXT NOT NULL DEFAULT 'to_cook'
    CHECK (kitchen_status IN ('to_cook', 'preparing', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid')),
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE RESTRICT,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_checkout NUMERIC(10, 2) NOT NULL,
  is_prepared BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self Order Tokens
CREATE TABLE IF NOT EXISTS public.self_order_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  session_id UUID NOT NULL REFERENCES public.pos_sessions(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 2. AUTOMATED PROFILE SYNC TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'staff' -- Default role; first user should manually be set to 'admin'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_of_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_order_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies to avoid conflicts
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;


-- PROFILES
CREATE POLICY profiles_select_authenticated ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_manage_service ON public.profiles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- POINT OF SALES
CREATE POLICY point_of_sales_select_auth ON public.point_of_sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY point_of_sales_insert_auth ON public.point_of_sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY point_of_sales_update_auth ON public.point_of_sales FOR UPDATE USING (auth.role() = 'authenticated');

-- PRODUCT CATEGORIES / PRODUCTS / VARIANTS (Read for all authenticated users)
CREATE POLICY categories_select_auth ON public.product_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY products_select_auth ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY variants_select_auth ON public.product_variants FOR SELECT USING (auth.role() = 'authenticated');

-- FLOORS / TABLES / PAYMENT METHODS (CRITICAL FIX FOR BLANK PAGE)
CREATE POLICY floors_select_auth ON public.floors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY tables_select_auth ON public.tables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY payment_methods_select_auth ON public.payment_methods FOR SELECT USING (auth.role() = 'authenticated');

-- SESSIONS
CREATE POLICY sessions_select_auth ON public.pos_sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY sessions_insert_auth ON public.pos_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY sessions_update_owner ON public.pos_sessions FOR UPDATE USING (responsible_user_id = auth.uid());

-- ORDERS
CREATE POLICY orders_select_auth ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY orders_insert_auth ON public.orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY orders_update_auth ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

-- CUSTOMERS
CREATE POLICY customers_select_auth ON public.customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY customers_insert_auth ON public.customers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY customers_update_auth ON public.customers FOR UPDATE USING (auth.role() = 'authenticated');

-- ORDER ITEMS
CREATE POLICY order_items_select_auth ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY order_items_insert_auth ON public.order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY order_items_update_auth ON public.order_items FOR UPDATE USING (auth.role() = 'authenticated');

-- SELF ORDER TOKENS
CREATE POLICY self_order_tokens_select_auth ON public.self_order_tokens FOR SELECT USING (auth.role() = 'authenticated');

-- SERVICE ROLE BYPASS (Ensure backend keeps working with service role key)
-- Note: Service role usually bypasses RLS, but these policies explicitly allow it for safety.
CREATE POLICY everything_service_role ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_pos ON public.point_of_sales FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_cat ON public.product_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_prod ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_var ON public.product_variants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_floor ON public.floors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_table ON public.tables FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_payment ON public.payment_methods FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_session ON public.pos_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_order ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_item ON public.order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_token ON public.self_order_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY everything_service_role_customer ON public.customers FOR ALL TO service_role USING (true) WITH CHECK (true);
