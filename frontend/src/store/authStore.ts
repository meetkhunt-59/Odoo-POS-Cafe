import { create } from 'zustand';
import type { Profile } from '../api/types';
import * as api from '../api/client';

interface AuthState {
  token: string | null;
  profile: Profile | null;
  loading: boolean;
  error: string;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('pos_token'),
  profile: null,
  loading: false,
  error: '',

  login: async (email, password) => {
    set({ loading: true, error: '' });
    try {
      const sess = await api.login(email, password);
      localStorage.setItem('pos_token', sess.access_token);
      set({ token: sess.access_token, loading: false });
      await get().fetchProfile();
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Login failed' });
      throw err;
    }
  },

  signup: async (email, password, name) => {
    set({ loading: true, error: '' });
    try {
      await api.signup({ email, password, name });
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Signup failed' });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    set({ token: null, profile: null });
  },

  fetchProfile: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const profile = await api.getMe(token);
      set({ profile });
    } catch {
      // Token might be expired
      get().logout();
    }
  },

  setToken: (token: string) => {
    localStorage.setItem('pos_token', token);
    set({ token });
  },

  isSidebarCollapsed: localStorage.getItem('sidebar_collapsed') === 'true',
  toggleSidebar: () => {
    const next = !get().isSidebarCollapsed;
    localStorage.setItem('sidebar_collapsed', String(next));
    set({ isSidebarCollapsed: next });
  },
  setSidebarCollapsed: (v) => {
    localStorage.setItem('sidebar_collapsed', String(v));
    set({ isSidebarCollapsed: v });
  },
}));