-- ============================================================
-- COMPLETE SUPABASE SCHEMA
-- Run this in order — dependencies are respected top to bottom
-- ============================================================
-- NOTE: kept for compatibility with earlier local setup.
-- Prefer Supabase CLI style migrations in `supabase/migrations/`.

-- 1. PROFILES
-- Linked to Supabase auth.users for role-based access
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 2. PRODUCT CATEGORIES
-- Groups products and controls kitchen routing at the category level
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  send_to_kitchen BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. PRODUCTS
-- Core menu items; send_to_kitchen NULL means inherit from category
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit TEXT,
  tax NUMERIC(5, 2) NOT NULL DEFAULT 0,
  description TEXT,
  send_to_kitchen BOOLEAN,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 4. PRODUCT VARIANTS
-- Optional size/pack variations tied to a product with price delta
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute TEXT NOT NULL,
  value TEXT NOT NULL,
  extra_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. FLOORS
-- Physical floor levels of the restaurant
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. TABLES
-- Individual tables on a floor with seat count and active state
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  seats INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  appointment_resource BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 7. PAYMENT METHODS
-- Supported payment types; upi_id required when type = 'upi'
CREATE TABLE payment_methods (
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


-- 8. POS SESSIONS
-- Tracks each cashier shift; closing_sale_amount required on close
CREATE TABLE pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsible_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  closing_sale_amount NUMERIC(10, 2),
  CONSTRAINT closed_session_must_have_amount CHECK (
    status != 'closed' OR (status = 'closed' AND closing_sale_amount IS NOT NULL)
  )
);


-- 9. ORDERS
-- Live orders tied to a session and optionally a table
-- payment_method_id stays NULL until payment is collected
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE NOT NULL,
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE RESTRICT,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  kitchen_status TEXT NOT NULL DEFAULT 'to_cook'
    CHECK (kitchen_status IN ('to_cook', 'preparing', 'completed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid')),
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE RESTRICT,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 10. ORDER ITEMS
-- Line items within an order; price locked at checkout time
-- is_prepared drives the kitchen display strike-through
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_checkout NUMERIC(10, 2) NOT NULL,
  is_prepared BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 11. SELF ORDER TOKENS (Optional)
-- QR-based tokens for customer self-ordering linked to session + table
CREATE TABLE self_order_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  session_id UUID NOT NULL REFERENCES pos_sessions(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
