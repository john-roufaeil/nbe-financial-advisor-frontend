import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

interface ConversationTitleState {
  /** Derived from each conversation's first user message, once loaded. */
  byConversationId: Record<string, string>;
  setTitle: (conversationId: string, title: string) => void;
}

/**
 * POST /chat/conversations/ has no title/rename endpoint in the current
 * contract, so a conversation's `title` field stays empty forever unless the
 * frontend derives one. Persisted so titles survive a reload instead of
 * reverting to "New chat" — conversations from before this store existed
 * (or opened on a different device) still show "New chat" until reopened
 * once, which is the same fallback used before any message has loaded.
 */
export const useConversationTitleStore = create<ConversationTitleState>()(
  persist(
    (set) => ({
      byConversationId: {},
      setTitle: (conversationId, title) =>
        set((s) => ({
          byConversationId: { ...s.byConversationId, [conversationId]: title },
        })),
    }),
    { name: STORAGE_KEYS.conversationTitles, version: 1 },
  ),
);
