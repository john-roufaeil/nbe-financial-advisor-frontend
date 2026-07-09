import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDataSourceStore } from "./use-data-source-store";

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
  /** Set when a 401 survives a refresh attempt — prompts a "session expired" modal. */
  sessionExpired: boolean;
  /** Stores tokens WITHOUT flipping isAuthenticated (signup happens mid-onboarding). */
  setTokens: (tokens: AuthTokens) => void;
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
      refreshToken: null,
      sessionExpired: false,
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      login: () => set({ isAuthenticated: true }),
      logout: () => {
        useDataSourceStore.getState().setSource("backend");
        // Explicit sign-out; clear sessionExpired too so a stray earlier flag
        // (or a late-arriving 401 from the logout request itself) can't pop
        // the "session expired" modal right after the user chose to leave.
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          sessionExpired: false,
        });
      },
      expireSession: () => {
        useDataSourceStore.getState().setSource("backend");
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          sessionExpired: true,
        });
      },
      clearStaleAuth: () => {
        useDataSourceStore.getState().setSource("backend");
        set({ isAuthenticated: false, accessToken: null, refreshToken: null });
      },
      clearSessionExpired: () => set({ sessionExpired: false }),
    }),
    // {
    //   name: "nbe_auth",
    //   // Persist ONLY the auth flag — never the tokens (see accessToken note).
    //   partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    // },
    {
      name: "nbe_auth",
      // WARNING: Exposes tokens to XSS. TEMPORARY
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
