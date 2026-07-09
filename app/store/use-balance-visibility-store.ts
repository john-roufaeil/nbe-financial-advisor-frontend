import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BalanceVisibilityState {
  hidden: boolean;
  toggle: () => void;
}

/** Client-only preference: blur monetary figures app-wide (dashboard, chat, transactions). */
export const useBalanceVisibilityStore = create<BalanceVisibilityState>()(
  persist(
    (set) => ({
      hidden: false,
      toggle: () => set((s) => ({ hidden: !s.hidden })),
    }),
    { name: "nbe_balance_hidden" },
  ),
);
