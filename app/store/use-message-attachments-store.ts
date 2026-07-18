import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";
import type { ChatAttachment } from "@/types/chat";

interface MessageAttachmentsState {
  byMessageId: Record<string, ChatAttachment[]>;
  setAttachments: (messageId: string, attachments: ChatAttachment[]) => void;
}

/**
 * The backend has no field linking a sent text message to an uploaded file —
 * file uploads are a separate POST .../attachments/ call that produces its
 * own assistant announcement message, and GET .../messages/ never echoes
 * attachments back on the user's own message. This is the only record of
 * which attachments were shown alongside which message, keyed by the real
 * (server-assigned) message id once the send resolves, so the chip survives
 * the refetch that replaces the optimistic entry instead of vanishing.
 */
export const useMessageAttachmentsStore = create<MessageAttachmentsState>()(
  persist(
    (set) => ({
      byMessageId: {},
      setAttachments: (messageId, attachments) =>
        set((s) => ({ byMessageId: { ...s.byMessageId, [messageId]: attachments } })),
    }),
    { name: STORAGE_KEYS.messageAttachments, version: 1 },
  ),
);
