import { create } from 'zustand';
import type { Product, ProductCategory, Floor, Table, PaymentMethod, SessionSummary, CartItem } from '../api/types';
import * as api from '../api/client';

interface PosState {
  // Data
  products: Product[];
  categories: ProductCategory[];
  floors: Floor[];
  tables: Table[];
  paymentMethods: PaymentMethod[];
  session: SessionSummary | null;

  // Cart
  cart: CartItem[];
  selectedTableId: string | null;
  selectedPaymentMethodId: string | null;

  // Loading
  loading: boolean;

  // Actions — fetch
  fetchAll: (token: string) => Promise<void>;
  fetchProducts: (token: string) => Promise<void>;
  fetchCategories: (token: string) => Promise<void>;
  fetchFloors: (token: string) => Promise<void>;
  fetchTables: (token: string) => Promise<void>;
  fetchPaymentMethods: (token: string) => Promise<void>;

  // Actions — session
  openSession: (token: string) => Promise<void>;

  // Actions — cart
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Actions — selection
  selectTable: (tableId: string | null) => void;
  selectPaymentMethod: (pmId: string | null) => void;
  resetForNewCustomer: () => void;
  clearCartOnly: () => void;
}

export const usePosStore = create<PosState>((set, get) => ({
  products: [],
  categories: [],
  floors: [],
  tables: [],
  paymentMethods: [],
  session: null,
  cart: [],
  selectedTableId: null,
  selectedPaymentMethodId: null,
  loading: false,

  fetchAll: async (token) => {
    set({ loading: true });
    try {
      const [products, categories, floors, tables, paymentMethods] = await Promise.all([
        api.listProducts(token),
        api.listCategories(token),
        api.listFloors(token),
        api.listTables(token),
        api.listPaymentMethods(token),
      ]);
      set({ products, categories, floors, tables, paymentMethods, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchProducts: async (token) => {
    const products = await api.listProducts(token);
    set({ products });
  },

  fetchCategories: async (token) => {
    const categories = await api.listCategories(token);
    set({ categories });
  },

  fetchFloors: async (token) => {
    const floors = await api.listFloors(token);
    set({ floors });
  },

  fetchTables: async (token) => {
    const tables = await api.listTables(token);
    set({ tables });
  },

  fetchPaymentMethods: async (token) => {
    const paymentMethods = await api.listPaymentMethods(token);
    set({ paymentMethods });
  },

  openSession: async (token) => {
    set({ loading: true });
    try {
      const session = await api.openSession(token);
      set({ session, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addToCart: (product) => {
    const { cart } = get();
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      set({
        cart: cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      set({ cart: [...cart, { product, quantity: 1 }] });
    }
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter((item) => item.product.id !== productId) });
  },

  updateCartQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    });
  },

  clearCart: () => set({ cart: [], selectedTableId: null, selectedPaymentMethodId: null }),

  selectTable: (tableId) => set({ selectedTableId: tableId }),
  selectPaymentMethod: (pmId) => set({ selectedPaymentMethodId: pmId }),
  resetForNewCustomer: () => set({ cart: [], selectedTableId: null, selectedPaymentMethodId: null }),
  clearCartOnly: () => set({ cart: [] }),
}));
