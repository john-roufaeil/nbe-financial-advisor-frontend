import { create } from "zustand";

/**
 * Client-only "stop generating" state, keyed by conversation id. There's no
 * backend endpoint to actually cancel an in-flight reply (the assistant's
 * message is still produced server-side, useMessages just polls for it) —
 * this only suppresses polling and the "generating" UI locally so the user
 * stops seeing/waiting for it. Cleared the next time a message is sent into
 * that conversation.
 */
interface ChatStopState {
  stoppedConversationIds: Set<string>;
  stop: (conversationId: string) => void;
  resume: (conversationId: string) => void;
}

export const useChatStopStore = create<ChatStopState>((set) => ({
  stoppedConversationIds: new Set(),
  stop: (conversationId) =>
    set((s) => ({
      stoppedConversationIds: new Set(s.stoppedConversationIds).add(conversationId),
    })),
  resume: (conversationId) =>
    set((s) => {
      if (!s.stoppedConversationIds.has(conversationId)) return s;
      const next = new Set(s.stoppedConversationIds);
      next.delete(conversationId);
      return { stoppedConversationIds: next };
    }),
}));
