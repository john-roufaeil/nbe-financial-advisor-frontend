import { create } from "zustand";
import type { NotificationAudience } from "@/types/notification";

interface NotificationsModalState {
  isOpen: boolean;
  tab: NotificationAudience;
  open: (tab?: NotificationAudience) => void;
  close: () => void;
  setTab: (tab: NotificationAudience) => void;
}

export const useNotificationsModalStore = create<NotificationsModalState>((set) => ({
  isOpen: false,
  tab: "everyone",
  open: (tab) => set({ isOpen: true, ...(tab ? { tab } : {}) }),
  close: () => set({ isOpen: false }),
  setTab: (tab) => set({ tab }),
}));
