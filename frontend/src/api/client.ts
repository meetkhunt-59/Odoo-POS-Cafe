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

// ── Products ─────────────────────────────────────────────────

export async function listProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/backend/products`, { headers: authHeaders(token) });
  return handleResponse<Product[]>(res);
}

export async function createProduct(
  token: string,
  payload: {
    name: string;
    category: string;
    price: number;
    unit?: string;
    tax?: number;
    description?: string;
    send_to_kitchen?: boolean;
  }
): Promise<Product> {
  const res = await fetch(`${API_BASE}/backend/products`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
  payload: { session_id: string; table_id?: string | null; items: OrderItemInput[] }
): Promise<Order> {
  const res = await fetch(`${API_BASE}/terminal/orders`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Order>(res);
}

export async function payOrder(token: string, orderId: string, paymentMethodId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/terminal/orders/${orderId}/pay`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_method_id: paymentMethodId }),
  });
  return handleResponse<Order>(res);
}

// ── Kitchen Display ──────────────────────────────────────────

export async function getKitchenOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/terminal/display/kitchen`, { headers: authHeaders(token) });
  return handleResponse<Order[]>(res);
}
