import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  isAuthenticated: boolean;
  /**
   * Tokens are held IN MEMORY ONLY — never persisted (see `partialize`). Writing
   * JWTs to localStorage exposes them to XSS exfiltration, unacceptable for a
   * bank-adjacent app. Trade-off: tokens do not survive a full page reload; the
   * real POST /auth/refresh flow will re-establish them (out of scope for now).
   */
  accessToken: string | null;
  refreshToken: string | null;
  /** Stores tokens WITHOUT flipping isAuthenticated (signup happens mid-onboarding). */
  setTokens: (tokens: AuthTokens) => void;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      login: () => set({ isAuthenticated: true }),
      logout: () =>
        set({ isAuthenticated: false, accessToken: null, refreshToken: null }),
    }),
    {
      name: "nbe_auth",
      // Persist ONLY the auth flag — never the tokens (see accessToken note).
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
);
