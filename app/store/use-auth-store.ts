import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDataSourceStore } from "./use-data-source-store";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

interface AuthTokens {
  accessToken: string;
}

interface AuthState {
  isAuthenticated: boolean;
  /**
   * Held IN MEMORY ONLY — never persisted (see `partialize`). Writing JWTs to
   * localStorage exposes them to XSS exfiltration, unacceptable for a
   * bank-adjacent app. It does not survive a reload; POST /auth/refresh
   * re-establishes it from the httpOnly cookie, which JS cannot read or steal.
   */
  accessToken: string | null;
  sessionExpired: boolean;
  /** Stores the token WITHOUT flipping isAuthenticated (signup happens mid-onboarding). */
  setTokens: (tokens: AuthTokens) => void;
  setAccessToken: (accessToken: string) => void;
  login: () => void;
  logout: () => void;
  /** Like logout(), but flags the UI to explain why (refresh failed after a 401). */
  expireSession: () => void;
  /** Silent variant of expireSession() for when there was never a session to expire (e.g. reload with no refresh token) — resets auth state without the modal. */
  clearStaleAuth: () => void;
  clearSessionExpired: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      sessionExpired: false,
      setTokens: (tokens) => set({ accessToken: tokens.accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      login: () => set({ isAuthenticated: true }),
      logout: () => {
        useDataSourceStore.getState().setSource("backend");
        set({ isAuthenticated: false, accessToken: null, sessionExpired: false });
      },
      expireSession: () => {
        useDataSourceStore.getState().setSource("backend");
        set({ isAuthenticated: false, accessToken: null, sessionExpired: true });
      },
      clearStaleAuth: () => {
        useDataSourceStore.getState().setSource("backend");
        set({ isAuthenticated: false, accessToken: null });
      },
      clearSessionExpired: () => set({ sessionExpired: false }),
    }),
    {
      name: STORAGE_KEYS.auth,
      // Persist ONLY the auth flag — never the token (see accessToken note).
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
);
