import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

/**
 * Convention: one small store per concern (UI, session, etc.), not a single
 * monolithic store. Server data belongs in TanStack Query, not here —
 * Zustand is for ephemeral client-only state (sidebar, active tab, wizard step).
 */
export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
