'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'DIRECTOR' | 'STAFF' | 'PLAYER';
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
  };
}

interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (token: string, refreshToken?: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set user
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null
        });
      },

      // Set tokens
      setTokens: (token, refreshToken) => {
        set({
          token,
          refreshToken: refreshToken || get().refreshToken,
          error: null
        });

        // Store token in localStorage for WebSocket auth
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Giriş başarısız');
          }

          const data = await response.json();

          set({
            user: data.user,
            token: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store token for WebSocket
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', data.accessToken);
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Bir hata oluştu',
          });
          throw error;
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });

        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
      },

      // Refresh session
      refreshSession: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          get().logout();
          return;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            get().logout();
            return;
          }

          const data = await response.json();

          set({
            user: data.user,
            token: data.accessToken,
            isAuthenticated: true,
            error: null,
          });

          // Update token in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', data.accessToken);
          }
        } catch (error) {
          get().logout();
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Auto-refresh token every 14 minutes (tokens expire in 15 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { isAuthenticated, refreshSession } = useAuthStore.getState();
    if (isAuthenticated) {
      refreshSession();
    }
  }, 14 * 60 * 1000);
}
