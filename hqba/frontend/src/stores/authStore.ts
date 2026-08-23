import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  pinLogin: (pin: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ email, password });
      const { user, token } = data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('invalid_credentials');
    }
  },

  pinLogin: async (pin) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.pinLogin({ pin });
      const { user, token } = data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error('invalid_credentials');
    }
  },

  logout: async () => {
    try {
      if (get().token) {
        await authApi.logout();
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await authApi.getUser();
      const user = data.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch {
      get().logout();
    }
  },

  setUser: (user) => set({ user }),

  hydrate: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },
}));
