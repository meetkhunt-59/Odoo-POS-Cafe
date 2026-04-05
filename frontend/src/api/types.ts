// TypeScript interfaces matching backend Pydantic schemas

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
}

export interface Profile {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

export interface PointOfSale {
  id: string;
  name: string;
  cash_enabled: boolean;
  upi_enabled: boolean;
  card_enabled: boolean;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  attribute: string;
  value: string;
  extra_price: number;
}

export interface ProductVariantInput {
  attribute: string;
  value: string;
  extra_price: number;
}

export interface ProductInput {
  name: string;
  category: string;
  price: number;
  unit?: string;
  tax?: number;
  description?: string;
  in_stock?: boolean;
  image_url?: string;
  variants?: ProductVariantInput[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string | null;
  tax: number;
  description: string | null;
  image_url: string | null;
  send_to_kitchen: boolean | null;
  is_active: boolean;
  in_stock: boolean;
  variants: ProductVariant[];
}

export interface ProductCategory {
  id: string;
  name: string;
  send_to_kitchen: boolean;
  product_count: number;
}

export interface Floor {
  id: string;
  name: string;
  tables: Table[];
}

export interface Table {
  id: string;
  floor_id: string;
  table_number: string;
  seats: number;
  is_active: boolean;
  appointment_resource: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  is_enabled: boolean;
  upi_id: string | null;
}

export interface SessionSummary {
  id: string;
  status: string;
  responsible_user_id: string;
  opened_at: string;
  closed_at: string | null;
  closing_sale_amount: number | null;
}

export interface OrderItemInput {
  product_id: string;
  variant_id?: string | null;
  quantity: number;
}

export interface OrderItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price_at_checkout: number;
  is_prepared: boolean;
}

export interface Order {
  id: string;
  order_number: number;
  session_id: string;
  table_id: string | null;
  kitchen_status: string;
  payment_status: string;
  total_amount: number;
  items: OrderItem[];
}

export interface TransactionSummary {
  id: string;
  order_number: number;
  created_at: string;
  total_amount: number;
  payment_status: string;
  kitchen_status: string;
  payment_method: string | null;
}

export interface PaymentSummary {
  date: string;
  payment_method: string;
  total_amount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  total_sales: number;
  created_at: string;
}

// Cart item type used only on the frontend
export interface CartItem {
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
}