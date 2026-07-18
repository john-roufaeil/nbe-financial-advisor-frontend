import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

export interface MessageFeedback {
  rating?: number;
  comment?: string;
}

interface MessageFeedbackState {
  byMessageId: Record<string, MessageFeedback>;
  setFeedback: (messageId: string, feedback: MessageFeedback) => void;
}

/**
 * Tracks which chat messages the user has already left feedback on, and
 * what they submitted. Persisted locally because POST /feedback/ has no
 * matching GET — the backend gives no way to ask "has this message already
 * gotten feedback", so this is the only record of it. Feedback given from a
 * different browser/device won't show as already-submitted here.
 */
export const useMessageFeedbackStore = create<MessageFeedbackState>()(
  persist(
    (set) => ({
      byMessageId: {},
      setFeedback: (messageId, feedback) =>
        set((s) => ({ byMessageId: { ...s.byMessageId, [messageId]: feedback } })),
    }),
    { name: STORAGE_KEYS.messageFeedback, version: 1 },
  ),
);
