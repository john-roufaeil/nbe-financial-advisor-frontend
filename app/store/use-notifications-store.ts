import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import type { AppNotification } from "@/types/notification";

/**
 * "account"-audience notifications are no longer seeded/stored here at all
 * — they're derived live from real backend data instead (unresolved
 * anomalies today; see app/lib/use-notifications.ts's useNotifications,
 * which is what SidebarFooter/NotificationsModal actually read). This store
 * now only owns "everyone" broadcasts, which really are frontend-only until
 * a real backend endpoint exists (see sendBroadcast below) — there's
 * nothing server-side to derive those from.
 */
interface NotificationsState {
  notifications: AppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Admin-only: appends a new "everyone" notification — this is the whole
   * broadcast feature until a real backend endpoint exists. */
  sendBroadcast: (input: { title: string; body: string }) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),
      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      sendBroadcast: ({ title, body }) =>
        set((s) => ({
          notifications: [
            {
              id: crypto.randomUUID(),
              audience: "everyone",
              title,
              body,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...s.notifications,
          ],
        })),
    }),
    { name: STORAGE_KEYS.notifications },
  ),
);
