export interface ChatToolCall {
  toolName: string;
  args: Record<string, string | number | boolean | null>;
  result: unknown;
}

export interface ChatReference {
  targetType: string;
  targetId: string;
}

export interface ChatThinkingStep {
  callId: string;
  tool: string;
  status: "started" | "completed";
}

/** Snapshot of the analysis agent's tool-call activity for one turn, taken
 * once the reply lands (use-event-stream.ts's chat_message handler) so it
 * persists on the message forever instead of vanishing with the live
 * indicator that produced it — see ChatThinkingSummary/use-chat-tool-status-
 * store's finish(). Absent for any turn that never called a tool. */
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
