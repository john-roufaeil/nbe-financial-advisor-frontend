import { create } from "zustand";

/**
 * In-memory step list for `chat_tool_status` SSE events (use-event-stream.ts),
 * keyed by conversation id — an accumulating ordered list, unlike
 * use-chat-stream-store's single replacing token buffer, since the UI shows
 * every tool call as a growing checklist (analysis agent only; other nodes
 * never emit these). Steps are matched by `callId`, not position or tool
 * name: the analysis agent's tool loop can hand back more than one
 * simultaneous tool call in a single turn, so "the last started step" is not
 * a safe way to find which one just completed. Cleared once
 * chat_message/chat_error lands for that conversation, same two cleanup
 * points as use-chat-stream-store.
 */
export interface ChatToolStep {
  callId: string;
  tool: string;
  status: "started" | "completed";
}

interface ChatToolStatusState {
  byConversationId: Record<string, ChatToolStep[]>;
  addStep: (conversationId: string, callId: string, tool: string) => void;
  completeStep: (conversationId: string, callId: string) => void;
  clear: (conversationId: string) => void;
}

export const useChatToolStatusStore = create<ChatToolStatusState>((set) => ({
  byConversationId: {},
  addStep: (conversationId, callId, tool) =>
    set((s) => {
      const steps = s.byConversationId[conversationId] ?? [];
      if (steps.some((step) => step.callId === callId)) return s;
      return {
        byConversationId: {
          ...s.byConversationId,
          [conversationId]: [...steps, { callId, tool, status: "started" }],
        },
      };
    }),
  completeStep: (conversationId, callId) =>
    set((s) => {
      const steps = s.byConversationId[conversationId];
      if (!steps) return s;
      return {
        byConversationId: {
          ...s.byConversationId,
          [conversationId]: steps.map((step) =>
            step.callId === callId ? { ...step, status: "completed" } : step,
          ),
        },
      };
    }),
  clear: (conversationId) =>
    set((s) => {
      if (!(conversationId in s.byConversationId)) return s;
      const next = { ...s.byConversationId };
      delete next[conversationId];
      return { byConversationId: next };
    }),
}));
