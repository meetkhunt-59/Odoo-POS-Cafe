const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const api = {
  async signup(payload) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async login(email, password) {
    const params = new URLSearchParams();
    params.set("username", email);
    params.set("password", password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async me(token) {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async listProducts(token) {
    const res = await fetch(`${API_BASE}/backend/products`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async listPaymentMethods(token) {
    const res = await fetch(`${API_BASE}/backend/payment-methods`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async openSession(token) {
    const res = await fetch(`${API_BASE}/terminal/sessions/open`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
