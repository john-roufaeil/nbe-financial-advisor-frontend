export interface ChatToolCall {
  toolName: string;
  args: Record<string, string | number | boolean | null>;
  result: unknown;
}

export interface ChatAttachment {
  id: string;
  type: "image" | "document";
  name: string;
}

export interface ChatReference {
  targetType: string;
  targetId: string;
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
  attachments?: ChatAttachment[];
  references?: ChatReference[];
  suggestions?: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
}
