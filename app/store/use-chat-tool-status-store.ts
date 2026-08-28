import { create } from "zustand";
import type { ChatThinking, ChatThinkingStep } from "@/types/chat";

/**
 * Live step list for the in-progress `chat_tool_status` SSE events
 * (use-event-stream.ts), keyed by conversation id — an accumulating ordered
 * list, unlike use-chat-stream-store's single replacing token buffer, since
 * the UI shows every tool call as a growing checklist while it's happening
 * (analysis agent only; other nodes never emit these). Steps are matched by
 * `callId`, not position or tool name: the analysis agent's tool loop can
 * hand back more than one simultaneous tool call in a single turn, so "the
 * last started step" is not a safe way to find which one just completed.
 *
 * `startedAt` is stamped lazily on the first step of a turn (there's no
 * meaningful "thinking" duration for a turn that never calls a tool) and
 * read back by `finish()` once the reply lands, to compute how long the
 * turn actually took — the live view (ChatToolStatusList) ticks a seconds
 * counter off the same timestamp while still in progress.
 */
interface ConversationThinking {
  steps: ChatThinkingStep[];
  startedAt: number;
}

interface ChatToolStatusState {
  byConversationId: Record<string, ConversationThinking | undefined>;
  addStep: (conversationId: string, callId: string, tool: string) => void;
  completeStep: (conversationId: string, callId: string) => void;
  /** Reads the current steps + elapsed duration, clears the live entry, and
   * returns the snapshot to attach to the now-finished message — undefined
   * if this turn never called a tool, so no summary is shown for it. */
  finish: (conversationId: string) => ChatThinking | undefined;
  clear: (conversationId: string) => void;
}

export const useChatToolStatusStore = create<ChatToolStatusState>((set, get) => ({
  byConversationId: {},
  addStep: (conversationId, callId, tool) =>
    set((s) => {
      const existing = s.byConversationId[conversationId];
      if (existing?.steps.some((step) => step.callId === callId)) return s;
      const steps = existing?.steps ?? [];
      return {
        byConversationId: {
          ...s.byConversationId,
          [conversationId]: {
            startedAt: existing?.startedAt ?? Date.now(),
            steps: [...steps, { callId, tool, status: "started" }],
          },
        },
      };
    }),
  completeStep: (conversationId, callId) =>
    set((s) => {
      const existing = s.byConversationId[conversationId];
      if (!existing) return s;
      return {
        byConversationId: {
          ...s.byConversationId,
          [conversationId]: {
            ...existing,
            steps: existing.steps.map((step) =>
              step.callId === callId ? { ...step, status: "completed" } : step,
            ),
          },
        },
      };
    }),
  finish: (conversationId) => {
    const existing = get().byConversationId[conversationId];
    get().clear(conversationId);
    if (!existing) return undefined;
    return { steps: existing.steps, durationMs: Date.now() - existing.startedAt };
  },
  clear: (conversationId) =>
    set((s) => {
      if (!(conversationId in s.byConversationId)) return s;
      const next = { ...s.byConversationId };
      delete next[conversationId];
      return { byConversationId: next };
    }),
}));
