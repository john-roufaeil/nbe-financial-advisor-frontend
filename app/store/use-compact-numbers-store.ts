import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CompactNumbersState {
  compact: boolean;
  setCompact: (compact: boolean) => void;
}

/** Client-only preference: abbreviate large numbers (1.2K/3.4M) app-wide instead of showing full digits. */
export const useCompactNumbersStore = create<CompactNumbersState>()(
  persist(
    (set) => ({
      compact: false,
      setCompact: (compact) => set({ compact }),
    }),
    { name: "nbe_compact_numbers" },
  ),
);
