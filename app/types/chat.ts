export interface ChatToolCall {
  toolName: string;
  args: Record<string, string | number | boolean | null>;
  result: unknown;
}

export interface ChatReference {
  targetType: string;
  targetId: string;
}

export type ChatThinkingStep =
  | { kind: "agent"; agent: string }
  | { kind: "tool"; callId: string; tool: string; status: "started" | "completed" };

/** Snapshot of one turn's thinking activity — which agent Maestro routed to
 * plus any tool calls made along the way — taken once the reply lands
 * (use-event-stream.ts's chat_message handler) so it persists on the
 * message forever instead of vanishing with the live indicator that
 * produced it — see ChatThinkingSummary/use-chat-tool-status-store's
 * clear(). Absent only for a turn that never routed anywhere at all. */
export interface ChatThinking {
  steps: ChatThinkingStep[];
  durationMs: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
  /**
   * A live response showed this is a topic label ("general"), not a
   * lifecycle state — it is NOT "complete"/"generating"/"failed". Kept as
   * opaque metadata only; whether a reply has arrived is judged from message
   * content instead (see isAwaitingReply in queries/chat.ts).
   */
  stage?: string;
  toolCall?: ChatToolCall;
  references?: ChatReference[];
  suggestions?: string[];
  thinking?: ChatThinking;
}

export interface ChatConversation {
  id: string;
  title: string;
}
