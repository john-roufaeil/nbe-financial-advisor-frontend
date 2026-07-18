import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

export const DASHBOARD_CARDS = [
  "stats",
  "goal",
  "budget",
  "activity",
  "notifications",
] as const;
export type DashboardCard = (typeof DASHBOARD_CARDS)[number];

interface DashboardPrefsState {
  /** Cards the user chose to hide via the Customize menu. */
  hiddenCards: DashboardCard[];
  toggleCard: (card: DashboardCard) => void;
  showAllCards: () => void;
}

/** Which dashboard cards are visible — the user's layout, persisted. */
export const useDashboardPrefsStore = create<DashboardPrefsState>()(
  persist(
    (set) => ({
      hiddenCards: [],
      toggleCard: (card) =>
        set((s) => ({
          hiddenCards: s.hiddenCards.includes(card)
            ? s.hiddenCards.filter((c) => c !== card)
            : [...s.hiddenCards, card],
        })),
      showAllCards: () => set({ hiddenCards: [] }),
    }),
    {
      name: STORAGE_KEYS.dashboardPreferences,
      merge: (persisted, current) => {
        const raw = (persisted as Partial<DashboardPrefsState> | undefined)?.hiddenCards;
        return {
          ...current,
          hiddenCards: Array.isArray(raw)
            ? raw.filter((c): c is DashboardCard =>
                (DASHBOARD_CARDS as readonly string[]).includes(c),
              )
            : [],
        };
      },
    },
  ),
);
