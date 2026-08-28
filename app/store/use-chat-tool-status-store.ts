import { create } from "zustand";
import type { ChatThinkingStep } from "@/types/chat";

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
 * meaningful "thinking" duration for a turn that never calls a tool) — the
 * live view (ChatToolStatusList) ticks a seconds counter off it while still
 * in progress. Once the turn ends, the persisted, server-computed
 * Message.thinking_json (see api/chat.ts's RawThinking) is the source of
 * truth for the summary shown thereafter, not this store — use-event-
 * stream.ts's chat_message handler just clears the live entry rather than
 * reading it back.
 */
interface ConversationThinking {
  steps: ChatThinkingStep[];
  startedAt: number;
}

interface ChatToolStatusState {
  byConversationId: Record<string, ConversationThinking | undefined>;
  addStep: (conversationId: string, callId: string, tool: string) => void;
  completeStep: (conversationId: string, callId: string) => void;
  setAgent: (conversationId: string, agent: string) => void;
  clear: (conversationId: string) => void;
}

export const useChatToolStatusStore = create<ChatToolStatusState>((set) => ({
  byConversationId: {},
  addStep: (conversationId, callId, tool) =>
    set((s) => {
      const existing = s.byConversationId[conversationId];
      if (
        existing?.steps.some((step) => step.kind === "tool" && step.callId === callId)
      ) {
        return s;
      }
      const steps = existing?.steps ?? [];
      return {
        byConversationId: {
          ...s.byConversationId,
          [conversationId]: {
            startedAt: existing?.startedAt ?? Date.now(),
            steps: [...steps, { kind: "tool", callId, tool, status: "started" }],
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
              step.kind === "tool" && step.callId === callId
                ? { ...step, status: "completed" }
                : step,
            ),
          },
        },
      };
    }),
  // agent_selected is single-shot per turn — inserted (or overwritten, on a
  // redelivery) at the front so it always reads first regardless of
  // whether any tool_call happened to arrive before it.
  setAgent: (conversationId, agent) =>
    set((s) => {
      const existing = s.byConversationId[conversationId];
      const rest = (existing?.steps ?? []).filter((step) => step.kind !== "agent");
      return {
        byConversationId: {
          ...s.byConversationId,
          [conversationId]: {
            startedAt: existing?.startedAt ?? Date.now(),
            steps: [{ kind: "agent", agent }, ...rest],
          },
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
