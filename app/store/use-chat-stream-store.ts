import { create } from "zustand";

/**
 * In-memory buffer for `chat_token` SSE deltas (use-event-stream.ts), keyed
 * by conversation id, so useMessages (queries/chat.ts) can render the
 * assistant's reply as it streams in instead of waiting on the terminal
 * chat_message event. Cleared once chat_message/chat_error lands for that
 * conversation — the persisted message (or timeout/error handling) takes
 * over from there.
 */
interface ChatStreamState {
  byConversationId: Record<string, string>;
  appendToken: (conversationId: string, delta: string) => void;
  clear: (conversationId: string) => void;
}

export const useChatStreamStore = create<ChatStreamState>((set) => ({
  byConversationId: {},
  appendToken: (conversationId, delta) =>
    set((s) => ({
      byConversationId: {
        ...s.byConversationId,
        [conversationId]: (s.byConversationId[conversationId] ?? "") + delta,
      },
    })),
  clear: (conversationId) =>
    set((s) => {
      if (!(conversationId in s.byConversationId)) return s;
      const next = { ...s.byConversationId };
      delete next[conversationId];
      return { byConversationId: next };
    }),
}));
