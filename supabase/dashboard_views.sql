-- ============================================================
-- POS CAFE: DASHBOARD AGGREGATED VIEWS
-- ============================================================
-- Description: Run this script in the Supabase SQL Editor.
-- This establishes database-level aggregations to rapidly calculate
-- KPIs, Top Products, and Time-series graphs for your Dashboard.
-- ============================================================

-- 1. DAILY SALES VIEW (For the Line Chart)
-- Aggregates total revenue (paid orders) per day.
CREATE OR REPLACE VIEW v_daily_sales AS
SELECT 
    date_trunc('day', created_at)::date AS sale_date,
    COUNT(*) AS total_orders,
    SUM(total_amount) AS total_revenue
FROM public.orders
WHERE payment_status = 'paid'
GROUP BY 1
ORDER BY 1 DESC;

-- 2. TOP PRODUCTS VIEW (For the Top 5 Products Table)
-- Aggregates quantity sold per product.
CREATE OR REPLACE VIEW v_top_products AS
SELECT 
    p.id AS product_id,
    p.name AS product_name,
    SUM(oi.quantity) AS total_sold,
    SUM(oi.quantity * oi.price_at_checkout) AS generated_revenue
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
JOIN public.products p ON oi.product_id = p.id
WHERE o.payment_status = 'paid'
GROUP BY p.id, p.name
ORDER BY total_sold DESC;

-- 3. TOP CATEGORIES VIEW (For the Pie Chart)
-- Aggregates percentage and absolute revenue by category.
CREATE OR REPLACE VIEW v_top_categories AS
SELECT 
    c.id AS category_id,
    c.name AS category_name,
    SUM(oi.quantity * oi.price_at_checkout) AS category_revenue,
    SUM(oi.quantity) AS category_items_sold
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
JOIN public.products p ON oi.product_id = p.id
JOIN public.product_categories c ON p.category_id = c.id
WHERE o.payment_status = 'paid'
GROUP BY c.id, c.name
ORDER BY category_revenue DESC;

-- 4. KPI SUMMARY VIEW
-- Simple one-row summary view for overall top-level metrics.
CREATE OR REPLACE VIEW v_kpi_summary AS
SELECT 
    COUNT(id) AS total_lifetime_orders,
    COALESCE(SUM(total_amount), 0) AS lifetime_revenue,
    CASE 
      WHEN COUNT(id) = 0 THEN 0 
      ELSE COALESCE(SUM(total_amount) / COUNT(id), 0) 
    END AS average_order_value
FROM public.orders
WHERE payment_status = 'paid';

-- Note: Because Supabase relies on REST, to allow querying views 
-- from your authenticated API requests, we should technically grant permissions
-- but Supabase grants them by default to `authenticated` and `service_role`.
GRANT SELECT ON v_daily_sales TO authenticated, service_role;
GRANT SELECT ON v_top_products TO authenticated, service_role;
GRANT SELECT ON v_top_categories TO authenticated, service_role;
GRANT SELECT ON v_kpi_summary TO authenticated, service_role;
