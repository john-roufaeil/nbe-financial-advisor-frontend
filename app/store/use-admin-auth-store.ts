import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import type { AdminRole } from "@/types/admin";

interface AdminAuthState {
  accessToken: string | null;
  adminId: string | null;
  role: AdminRole | null;
  login: (session: { accessToken: string; adminId: string; role: AdminRole }) => void;
  logout: () => void;
}

/**
 * Admin session, fully separate from the end-user auth store: admin tokens are
 * never interchangeable with user tokens, and the backend has NO admin
 * refresh/logout endpoint — the token just expires, at which point the 401
 * interceptor in api/admin-client.ts calls logout() and the guard bounces back
 * to the admin sign-in page.
 *
 * Persisted to sessionStorage (not localStorage like the user store): with no
 * refresh flow there is no httpOnly-cookie restore path, so without persisting
 * the token an admin would re-enter credentials on every reload. sessionStorage
 * keeps that convenience while scoping the token to the tab's lifetime.
 */
export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      adminId: null,
      role: null,
      login: ({ accessToken, adminId, role }) => set({ accessToken, adminId, role }),
      logout: () => set({ accessToken: null, adminId: null, role: null }),
    }),
    {
      name: STORAGE_KEYS.adminAuth,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
