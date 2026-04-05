import type {
  TokenResponse,
  Profile,
  Product,
  ProductCategory,
  Floor,
  Table,
  PaymentMethod,
  SessionSummary,
  Order,
  OrderItemInput,
  PointOfSale,
  TransactionSummary,
  PaymentSummary,
  Customer,
  ProductInput,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// ── Helpers ──────────────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────

export async function signup(payload: { email: string; password: string; name: string }): Promise<Profile> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Profile>(res);
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const params = new URLSearchParams();
  params.set('username', email);
  params.set('password', password);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  return handleResponse<TokenResponse>(res);
}

export async function getMe(token: string): Promise<Profile> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(token) });
  return handleResponse<Profile>(res);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/request-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function updatePassword(email: string, otp: string, new_password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/update-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, new_password }),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── Point of Sales ───────────────────────────────────────────

export async function listPointOfSales(token: string): Promise<PointOfSale[]> {
  const res = await fetch(`${API_BASE}/backend/pos`, { headers: authHeaders(token) });
  return handleResponse<PointOfSale[]>(res);
}

export async function createPointOfSale(
  token: string,
  payload: { name: string; cash_enabled: boolean; upi_enabled: boolean; card_enabled: boolean }
): Promise<PointOfSale> {
  const res = await fetch(`${API_BASE}/backend/pos`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<PointOfSale>(res);
}

export async function updatePointOfSale(
  token: string,
  id: string,
  payload: { name?: string; cash_enabled?: boolean; upi_enabled?: boolean; card_enabled?: boolean }
): Promise<PointOfSale> {
  const res = await fetch(`${API_BASE}/backend/pos/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<PointOfSale>(res);
}

// ── Product Categories ───────────────────────────────────────

export async function listCategories(token: string): Promise<ProductCategory[]> {
  const res = await fetch(`${API_BASE}/backend/product-categories`, { headers: authHeaders(token) });
  return handleResponse<ProductCategory[]>(res);
}

export async function createCategory(token: string, name: string): Promise<ProductCategory> {
  const res = await fetch(`${API_BASE}/backend/product-categories`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse<ProductCategory>(res);
}

export async function updateCategory(token: string, id: string, data: { name?: string; send_to_kitchen?: boolean }): Promise<ProductCategory> {
  const res = await fetch(`${API_BASE}/backend/product-categories/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<ProductCategory>(res);
}

// ── Products ─────────────────────────────────────────────────

export async function listProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/backend/products`, { headers: authHeaders(token) });
  return handleResponse<Product[]>(res);
}

export async function createProduct(token: string, payload: ProductInput): Promise<Product> {
  const res = await fetch(`${API_BASE}/backend/products`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Product>(res);
}

export async function updateProduct(token: string, id: string, data: Partial<ProductInput>): Promise<Product> {
  const res = await fetch(`${API_BASE}/backend/products/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Product>(res);
}

export async function deleteProduct(token: string, productId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/backend/products/${productId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── Floors ───────────────────────────────────────────────────

export async function listFloors(token: string): Promise<Floor[]> {
  const res = await fetch(`${API_BASE}/backend/floors`, { headers: authHeaders(token) });
  return handleResponse<Floor[]>(res);
}

export async function createFloor(token: string, name: string): Promise<Floor> {
  const res = await fetch(`${API_BASE}/backend/floors`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse<Floor>(res);
}

export async function updateFloor(token: string, id: string, name: string): Promise<Floor> {
  const res = await fetch(`${API_BASE}/backend/floors/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse<Floor>(res);
}

export async function deleteFloor(token: string, floorId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/backend/floors/${floorId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── Tables ───────────────────────────────────────────────────

export async function listTables(token: string): Promise<Table[]> {
  const res = await fetch(`${API_BASE}/backend/tables`, { headers: authHeaders(token) });
  return handleResponse<Table[]>(res);
}

export async function createTable(
  token: string,
  payload: { floor_id: string; table_number: string; seats: number }
): Promise<Table> {
  const res = await fetch(`${API_BASE}/backend/tables`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Table>(res);
}

export async function updateTable(token: string, id: string, data: Partial<Table>): Promise<Table> {
  const res = await fetch(`${API_BASE}/backend/tables/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Table>(res);
}

export async function deleteTable(token: string, tableId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/backend/tables/${tableId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── Payment Methods ──────────────────────────────────────────

export async function listPaymentMethods(token: string): Promise<PaymentMethod[]> {
  const res = await fetch(`${API_BASE}/backend/payment-methods`, { headers: authHeaders(token) });
  return handleResponse<PaymentMethod[]>(res);
}

export async function createPaymentMethod(
  token: string,
  payload: { name: string; type: string; upi_id?: string }
): Promise<PaymentMethod> {
  const res = await fetch(`${API_BASE}/backend/payment-methods`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<PaymentMethod>(res);
}

export async function updatePaymentMethod(token: string, id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
  const res = await fetch(`${API_BASE}/backend/payment-methods/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<PaymentMethod>(res);
}

export async function deletePaymentMethod(token: string, pmId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/backend/payment-methods/${pmId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── Terminal / Sessions ──────────────────────────────────────

export async function openSession(token: string): Promise<SessionSummary> {
  const res = await fetch(`${API_BASE}/terminal/sessions/open`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return handleResponse<SessionSummary>(res);
}

// ── Orders ───────────────────────────────────────────────────

export async function createOrder(
  token: string,
  payload: { session_id: string; table_id?: string | null; customer_id?: string | null; notes?: string; discount_percentage?: number; items: OrderItemInput[] }
): Promise<Order> {
  const res = await fetch(`${API_BASE}/terminal/orders`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Order>(res);
}

export async function createRazorpayOrder(
  token: string,
  orderId: string
): Promise<{ razorpay_order_id: string; amount: number; currency: string; key_id: string }> {
  const res = await fetch(`${API_BASE}/terminal/orders/${orderId}/razorpay`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' }
  });
  return handleResponse(res);
}

export async function payOrder(token: string, orderId: string, paymentMethodId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/terminal/orders/${orderId}/pay`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_method_id: paymentMethodId }),
  });
  return handleResponse<Order>(res);
}

export async function deleteOrder(token: string, orderId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/terminal/orders/${orderId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await res.text());
}

// ── Transactions ─────────────────────────────────────────────

export async function getTransactions(token: string, limit: number = 50, offset: number = 0): Promise<TransactionSummary[]> {
  const res = await fetch(`${API_BASE}/terminal/transactions?limit=${limit}&offset=${offset}`, { headers: authHeaders(token) });
  return handleResponse<TransactionSummary[]>(res);
}

export async function getPaymentSummary(token: string): Promise<PaymentSummary[]> {
  const res = await fetch(`${API_BASE}/terminal/payments/summary`, { headers: authHeaders(token) });
  return handleResponse<PaymentSummary[]>(res);
}

// ── Customers ────────────────────────────────────────────────

export async function getCustomers(token: string, search: string = '', limit: number = 50, offset: number = 0): Promise<Customer[]> {
  const params = new URLSearchParams({ search, limit: limit.toString(), offset: offset.toString() });
  const res = await fetch(`${API_BASE}/terminal/customers?${params.toString()}`, { headers: authHeaders(token) });
  return handleResponse<Customer[]>(res);
}

export async function createCustomer(token: string, data: { name: string; phone?: string; email?: string; address?: string; city?: string; state?: string; country?: string }): Promise<Customer> {
  const res = await fetch(`${API_BASE}/terminal/customers`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Customer>(res);
}

// ── Kitchen Display ──────────────────────────────────────────

export async function getKitchenOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/terminal/display/kitchen`, { headers: authHeaders(token) });
  return handleResponse<Order[]>(res);
}

export async function updateOrderStatus(token: string, orderId: string, action: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/terminal/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  return handleResponse<Order>(res);
}

// ── Public Self-Ordering ─────────────────────────────────────

export async function getPublicProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/public/products`);
  return handleResponse<Product[]>(res);
}

export async function getPublicCategories(): Promise<ProductCategory[]> {
  const res = await fetch(`${API_BASE}/public/categories`);
  return handleResponse<ProductCategory[]>(res);
}

export async function createPublicOrder(token: string, payload: any): Promise<Order> {
  const res = await fetch(`${API_BASE}/public/orders?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Order>(res);
}
// ── Dashboard ────────────────────────────────────────────────

export async function fetchDashboardStats(
  token: string,
  period: string = 'all',
  employee_id: string = 'all',
  session_id: string = 'all',
  product_id: string = 'all'
): Promise<any> {
  const params = new URLSearchParams();
  if (period !== 'all') params.set('period', period);
  if (employee_id !== 'all') params.set('employee_id', employee_id);
  if (session_id !== 'all') params.set('session_id', session_id);
  if (product_id !== 'all') params.set('product_id', product_id);
  
  const url = `${API_BASE}/backend/dashboard/stats${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  return handleResponse<any>(res);
}
