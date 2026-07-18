import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import type { AppNotification } from "@/types/notification";

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "seed-everyone-1",
    audience: "everyone",
    title: "Welcome to the new dashboard",
    body: "We refreshed the dashboard layout — customize which cards you see from the toolbar.",
    createdAt: "2026-07-10T09:00:00.000Z",
    read: false,
  },
  {
    id: "seed-everyone-2",
    audience: "everyone",
    title: "Scheduled maintenance",
    body: "We're rolling out improvements tonight — you might see a brief reconnect in chat.",
    createdAt: "2026-07-17T18:00:00.000Z",
    read: false,
  },
  {
    id: "seed-account-1",
    audience: "account",
    title: "Bank statement processed",
    body: "Your latest uploaded bank statement finished processing.",
    createdAt: "2026-07-15T14:30:00.000Z",
    read: false,
  },
];

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
      notifications: SEED_NOTIFICATIONS,
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
