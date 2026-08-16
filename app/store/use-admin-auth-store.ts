import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import type { AdminRole } from "@/types/admin";

interface AdminAuthState {
  isAuthenticated: boolean;
  /**
   * Held IN MEMORY ONLY — never persisted (see `partialize`). SEC-009: this
   * used to be written to sessionStorage (JS-readable, and a materially
   * higher-value XSS target than the end-user token, which was never
   * persisted for exactly this reason) because the backend had no admin
   * refresh/logout endpoint to restore a session from otherwise. Now that
   * POST /admin/auth/refresh exists, this mirrors use-auth-store.ts exactly:
   * a reload drops the token, and useAdminSessionRestore trades the
   * httpOnly admin_refresh_token cookie for a fresh one.
   */
  accessToken: string | null;
  adminId: string | null;
  role: AdminRole | null;
  login: (session: { accessToken: string; adminId: string; role: AdminRole }) => void;
  setAccessToken: (accessToken: string, adminId: string, role: AdminRole) => void;
  logout: () => void;
}

/**
 * Admin session, fully separate from the end-user auth store: admin tokens
 * are never interchangeable with user tokens, and this store's own refresh/
 * logout flow (POST /admin/auth/refresh, POST /admin/auth/logout) is
 * completely independent of the end-user one (core/views/administration.py).
 *
 * Only `isAuthenticated` is persisted (localStorage, same as use-auth-store) —
 * the token itself never touches storage JS can read back out.
 */
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      accessToken: null,
      adminId: null,
      role: null,
      login: ({ accessToken, adminId, role }) =>
        set({ isAuthenticated: true, accessToken, adminId, role }),
      // Used by the refresh flow to restore accessToken/adminId/role after a
      // reload without re-flagging isAuthenticated (it's already true — see
      // login() above for the initial sign-in that sets it).
      setAccessToken: (accessToken, adminId, role) => set({ accessToken, adminId, role }),
      logout: () =>
        set({ isAuthenticated: false, accessToken: null, adminId: null, role: null }),
    }),
    {
      name: STORAGE_KEYS.adminAuth,
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
);
