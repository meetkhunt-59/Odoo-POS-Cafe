import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, ProductCategory, Floor, Table, PaymentMethod, SessionSummary, CartItem, Customer, PointOfSale } from '../api/types';
import * as api from '../api/client';

interface PosState {
  // Data
  products: Product[];
  categories: ProductCategory[];
  floors: Floor[];
  tables: Table[];
  paymentMethods: PaymentMethod[];
  pointOfSales: PointOfSale[];
  session: SessionSummary | null;

  // Cart
  cart: CartItem[];
  selectedTableId: string | null;
  selectedCustomer: Customer | null;
  selectedPaymentMethodId: string | null;
  discountPercent: number;
  orderNote: string;
  orderType: 'Dine In' | 'Take Away';

  // Loading
  loading: boolean;

  // Order State
  activeOrder: { id: string; number: number; total: number } | null;
  paymentSuccessOrderNumber: number | null;

  // Actions — fetch
  fetchAll: (token: string) => Promise<void>;
  fetchProducts: (token: string) => Promise<void>;
  fetchCategories: (token: string) => Promise<void>;
  fetchFloors: (token: string) => Promise<void>;
  fetchTables: (token: string) => Promise<void>;
  fetchPaymentMethods: (token: string) => Promise<void>;
  fetchPointOfSales: (token: string) => Promise<void>;

  // Actions — session
  openSession: (token: string, posId?: string) => Promise<void>;

  // Actions — cart
  addToCart: (product: Product, variant?: any | null) => void;
  removeFromCart: (productId: string, variantId?: string | null) => void;
  updateCartQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;

  // Actions — selection
  selectTable: (tableId: string | null) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  selectPaymentMethod: (pmId: string | null) => void;
  setDiscountPercent: (percent: number) => void;
  setOrderNote: (note: string) => void;
  setOrderType: (type: 'Dine In' | 'Take Away') => void;
  markTableBusy: (tableId: string | null, isBusy: boolean) => void;
  resetForNewCustomer: () => void;
  clearCartOnly: () => void;
  setActiveOrder: (order: { id: string; number: number; total: number } | null) => void;
  setPaymentSuccess: (orderNumber: number | null) => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      floors: [],
      tables: [],
      paymentMethods: [],
      pointOfSales: [],
      session: null,
      cart: [],
      selectedTableId: null,
      selectedCustomer: null,
      selectedPaymentMethodId: null,
      discountPercent: 0,
      orderNote: '',
      orderType: 'Dine In',
      loading: false,
      activeOrder: null,
      paymentSuccessOrderNumber: null,

      fetchAll: async (token) => {
        set({ loading: true });
        try {
          const [products, categories, floors, tables, paymentMethods, pointOfSales] = await Promise.all([
            api.listProducts(token),
            api.listCategories(token),
            api.listFloors(token),
            api.listTables(token),
            api.listPaymentMethods(token),
            api.listPointOfSales(token)
          ]);
          set({ products, categories, floors, tables, paymentMethods, pointOfSales, loading: false });
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

      fetchPointOfSales: async (token) => {
        const pointOfSales = await api.listPointOfSales(token);
        set({ pointOfSales });
      },

      openSession: async (token, posId) => {
        set({ loading: true });
        try {
          const session = await api.openSession(token, posId);
          set({ session, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      addToCart: (product, variant = null) => {
        const { cart } = get();
        const existing = cart.find((item) => 
          item.product.id === product.id && 
          (variant ? item.variant?.id === variant.id : !item.variant)
        );
        
        if (existing) {
          set({
            cart: cart.map((item) =>
              (item.product.id === product.id && (variant ? item.variant?.id === variant.id : !item.variant))
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { product, variant, quantity: 1 }] });
        }
      },
      
      removeFromCart: (productId, variantId = null) => {
        set({ 
          cart: get().cart.filter((item) => 
            !(item.product.id === productId && (variantId ? item.variant?.id === variantId : !item.variant))
          ) 
        });
      },

      updateCartQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId, variantId);
          return;
        }
        set({
          cart: get().cart.map((item) =>
            (item.product.id === productId && (variantId ? item.variant?.id === variantId : !item.variant))
              ? { ...item, quantity } 
              : item
          ),
        });
      },

      clearCart: () => set({ cart: [], selectedTableId: null, selectedCustomer: null, selectedPaymentMethodId: null }),

      selectTable: (tableId) => set({ selectedTableId: tableId }),
      setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
      selectPaymentMethod: (pmId) => set({ selectedPaymentMethodId: pmId }),
      setDiscountPercent: (percent) => set({ discountPercent: percent }),
      setOrderNote: (note) => set({ orderNote: note }),
      setOrderType: (type) => set({ orderType: type }),

      markTableBusy: (tableId, isBusy) => set(state => {
        if (!tableId) return state;
        return {
          tables: state.tables.map(t => t.id === tableId ? { ...t, appointment_resource: isBusy } : t)
        };
      }),

      resetForNewCustomer: () => set({ 
        cart: [], 
        selectedTableId: null, 
        selectedCustomer: null, 
        selectedPaymentMethodId: null,
        discountPercent: 0,
        orderNote: '',
        orderType: 'Dine In',
        activeOrder: null,
        paymentSuccessOrderNumber: null
      }),
      
      clearCartOnly: () => set({ 
        cart: [],
        discountPercent: 0,
        orderNote: '',
      }),
      setActiveOrder: (order) => set({ activeOrder: order }),
      setPaymentSuccess: (num) => set({ paymentSuccessOrderNumber: num }),
    }),
    {
      name: 'pos-storage',
      partialize: (state) => ({
        session: state.session,
        cart: state.cart,
        selectedTableId: state.selectedTableId,
        selectedPaymentMethodId: state.selectedPaymentMethodId,
        activeOrder: state.activeOrder,
        paymentSuccessOrderNumber: state.paymentSuccessOrderNumber,
      }),
    }
  )
);

// --- Real-Time Sync WebSocket (Cashier -> Customer Display) ---
let ws: WebSocket | null = null;

const connectWebSocket = () => {
    if (ws) return;
    const wsUrl = (import.meta.env.VITE_API_BASE || 'http://localhost:8000').replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/display';
    ws = new WebSocket(wsUrl);
    ws.onopen = () => console.log('Connected to Customer Display Sync WebSocket');
    ws.onclose = () => {
        ws = null;
        setTimeout(connectWebSocket, 3000);
    };
    ws.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload.action === 'PAYMENT_SUCCESS') {
                usePosStore.getState().setPaymentSuccess(payload.data.order_number);
            }
        } catch(e) {}
    };
};

// Initiate connection immediately
connectWebSocket();

export const broadcastToDisplay = (action: string, data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action, data }));
    }
};

// Broadcast cart changes automatically
usePosStore.subscribe((state, prevState) => {
    if (
        state.cart !== prevState.cart || 
        state.discountPercent !== prevState.discountPercent ||
        state.selectedTableId !== prevState.selectedTableId ||
        state.paymentSuccessOrderNumber !== prevState.paymentSuccessOrderNumber
    ) {
        broadcastToDisplay('SYNC_CART', {
            cart: state.cart,
            discountPercent: state.discountPercent,
            selectedTableId: state.selectedTableId,
            paymentSuccessOrderNumber: state.paymentSuccessOrderNumber,
            tables: state.tables
        });
    }
});