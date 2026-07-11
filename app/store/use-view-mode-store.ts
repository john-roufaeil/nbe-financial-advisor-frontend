import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "list" | "grid";

interface ViewModeState {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

/** Client-only preference: list vs grid layout for the data tables (transactions, bank statements). */
export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      mode: "list",
      setMode: (mode) => set({ mode }),
    }),
    { name: "nbe_data_view_mode" },
  ),
);
