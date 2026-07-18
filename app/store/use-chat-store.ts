import { create } from "zustand";

/**
 * Client-only chat UI state. Conversations and messages themselves live in
 * the server cache (see app/queries/chat.ts) — this store only tracks which
 * conversation is currently open.
 */
interface ChatUIState {
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
}

export const useChatStore = create<ChatUIState>((set) => ({
  currentConversationId: null,
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
}));
