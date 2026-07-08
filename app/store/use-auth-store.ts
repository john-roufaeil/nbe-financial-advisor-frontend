import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (tokens?: AuthTokens) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      login: (tokens) =>
        set({
          isAuthenticated: true,
          accessToken: tokens?.accessToken ?? null,
          refreshToken: tokens?.refreshToken ?? null,
        }),
      logout: () =>
        set({ isAuthenticated: false, accessToken: null, refreshToken: null }),
    }),
    { name: "nbe_auth" },
  ),
);
