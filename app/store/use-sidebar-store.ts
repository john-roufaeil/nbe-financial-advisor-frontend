import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import { MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from "@/lib/constants/layout";

interface SidebarState {
  width: number;
  isCollapsed: boolean;
  setWidth: (width: number) => void;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapse: () => void;
}

/** Client-only preference: desktop sidebar width/collapsed state, persisted across reloads. */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      width: (MIN_SIDEBAR_WIDTH + MAX_SIDEBAR_WIDTH) / 2,
      isCollapsed: false,
      setWidth: (width) => set({ width }),
      setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
    }),
    { name: STORAGE_KEYS.sidebar },
  ),
);
