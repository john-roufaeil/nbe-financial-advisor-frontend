import { create } from "zustand";

interface SidebarState {
  width: number;
  isCollapsed: boolean;
  setWidth: (width: number) => void;
  toggleCollapse: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  width: 288,
  isCollapsed: false,
  setWidth: (width) => set({ width }),
  toggleCollapse: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
}));
