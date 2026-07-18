import { delay } from "@/mocks/shared";
import { MOCK_CHAT_LATENCY_MS } from "@/lib/constants/time";
import {
  buildSpendingBreakdown,
  buildTransactionsList,
  buildSavingsSlider,
  buildSuggestions,
  wantsSpendingBreakdown,
  wantsTransactions,
  wantsSavingsPlan,
} from "@/lib/demo-financials";
import type { ChatConversation, ChatMessage, ChatToolCall } from "@/types/chat";

let conversations: ChatConversation[] = [];
const messagesByConversation: Record<string, ChatMessage[]> = {};

function ensure(conversationId: string): ChatMessage[] {
  return (messagesByConversation[conversationId] ??= []);
}

export function getConversations(): Promise<ChatConversation[]> {
  return delay([...conversations]);
}

export function createConversation(): Promise<ChatConversation> {
  const conversation: ChatConversation = { id: crypto.randomUUID(), title: "New chat" };
  conversations = [conversation, ...conversations];
  ensure(conversation.id);
  return delay(conversation);
}

export function deleteConversation(id: string): Promise<void> {
  conversations = conversations.filter((c) => c.id !== id);
  delete messagesByConversation[id];
  return delay(undefined);
}

export function getMessages(conversationId: string): Promise<ChatMessage[]> {
  return delay([...ensure(conversationId)]);
}

function pickReply(text: string): { text: string; toolCall?: ChatToolCall } {
  if (wantsSavingsPlan(text)) {
    return {
      text: "Here's a quick savings projection — drag the slider to see how different monthly amounts add up over the year.",
      toolCall: buildSavingsSlider(),
    };
  }
  if (wantsTransactions(text)) {
    return {
      text: "Here are your most recent transactions. This is placeholder data — no backend is connected yet.",
      toolCall: buildTransactionsList(),
    };
  }
  if (wantsSpendingBreakdown(text)) {
    return {
      text: "Here's how your spending breaks down across categories. This is placeholder data — no backend is connected yet.",
      toolCall: buildSpendingBreakdown(),
    };
  }
  return {
    text: `Placeholder response. You said: "${text}". No backend connected yet. Try asking about your spending, recent transactions, or savings plan to see a live tool card.`,
  };
}

/**
 * Mirrors the real 202-and-poll contract: the user message lands immediately,
 * a "generating" placeholder follows, and a timeout later flips it to
 * "complete" with the actual reply — so useMessages' polling logic exercises
 * the same code path against mock data as it will against the backend.
 */
export function sendMessage(
  conversationId: string,
  content: string,
): Promise<ChatMessage> {
  const list = ensure(conversationId);

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: content,
    createdAt: Date.now(),
    stage: "complete",
  };
  list.push(userMessage);

  if (list.length === 1) {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (conversation) conversation.title = content.slice(0, 40);
  }

  const pendingId = crypto.randomUUID();
  list.push({
    id: pendingId,
    role: "assistant",
    text: "",
    createdAt: Date.now(),
    stage: "generating",
  });

  setTimeout(() => {
    const { text, toolCall } = pickReply(content);
    const index = list.findIndex((m) => m.id === pendingId);
    if (index === -1) return;
    list[index] = {
      id: pendingId,
      role: "assistant",
      text,
      createdAt: Date.now(),
      stage: "complete",
      toolCall,
      suggestions: buildSuggestions(toolCall?.toolName),
    };
  }, MOCK_CHAT_LATENCY_MS);

  return delay(userMessage);
}

export function uploadChatAttachment(
  conversationId: string,
  file: File,
): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    role: "assistant",
    text: `Uploaded "${file.name}" — no backend connected yet, so it won't appear in Bank Statements.`,
    createdAt: Date.now(),
    stage: "complete",
  };
  ensure(conversationId).push(message);
  return delay(message);
}
