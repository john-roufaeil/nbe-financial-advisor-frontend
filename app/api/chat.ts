import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import { buildSuggestions } from "@/lib/demo-financials";
import type { ChatConversation, ChatMessage, ChatToolCall } from "@/types/chat";

interface RawConversation {
  id: string;
  title?: string | null;
}

export interface RawReference {
  target_type: string;
  target_id: string;
}

/** `widget` is a nested object (type + payload), not JSON-in-string; `content` is
 * plain prose alongside it. `stage` is a topic label ("general"), not a lifecycle
 * state — see isAwaitingReply in queries/chat.ts, which doesn't depend on it. */
export interface RawWidget {
  type: string;
  payload: unknown;
}

interface RawMessage {
  id: string;
  sender: string;
  content: string;
  stage: string | null;
  widget: RawWidget | null;
  references: RawReference[] | null;
  created_at: string;
}

/** Swagger doesn't specify whether list endpoints are paginated envelopes or
 *  bare arrays yet — accept either shape until confirmed. */
type ListEnvelope<T> = T[] | { results: T[] };

function toList<T>(data: ListEnvelope<T>): T[] {
  return Array.isArray(data) ? data : data.results;
}

/**
 * `widget.type` must match a key in chatToolComponents to render as a card.
 * Gated to assistant messages: assistant-ui hard-rejects a tool-call part
 * on a "user" message.
 */
function parseToolCall(raw: RawMessage): ChatToolCall | undefined {
  if (!raw.widget || raw.sender !== "assistant") return undefined;
  return { toolName: raw.widget.type, args: {}, result: raw.widget.payload };
}

function toChatMessage(raw: RawMessage): ChatMessage {
  const role = raw.sender === "assistant" ? "assistant" : "user";
  const toolCall = parseToolCall(raw);
  return {
    id: raw.id,
    role,
    text: raw.content,
    createdAt: new Date(raw.created_at).getTime(),
    stage: raw.stage ?? undefined,
    toolCall,
    references: raw.references?.map((r) => ({
      targetType: r.target_type,
      targetId: r.target_id,
    })),
    // The backend doesn't supply follow-up suggestions itself — fall back to
    // static, topic-keyed chips so the "continue the conversation" chips still
    // show for real replies.
    ...(role === "assistant"
      ? { suggestions: buildSuggestions(toolCall?.toolName) }
      : {}),
  };
}

/**
 * Builds the assistant's ChatMessage from the chat_message SSE event payload
 * instead of paying for a GET .../messages round trip. Shape matches REST
 * exactly (same widget_json the backend publishes); only `created_at` is
 * approximated as "now" since the event carries no timestamp.
 */
export function assistantMessageFromEvent(payload: {
  id: string;
  content: string;
  widget: RawWidget | null;
  references: RawReference[] | null;
}): ChatMessage {
  return toChatMessage({
    id: payload.id,
    sender: "assistant",
    content: payload.content,
    stage: null,
    widget: payload.widget,
    references: payload.references,
    created_at: new Date().toISOString(),
  });
}

function toConversation(raw: RawConversation): ChatConversation {
  return { id: raw.id, title: raw.title?.trim() || "" };
}

export async function getConversations(): Promise<ChatConversation[]> {
  const res = await apiClient.get<ListEnvelope<RawConversation>>(
    API_ENDPOINTS.chatConversations,
  );
  return toList(res.data).map(toConversation);
}

export async function createConversation(): Promise<ChatConversation> {
  const res = await apiClient.post<RawConversation>(API_ENDPOINTS.chatConversations, {});
  return toConversation(res.data);
}

export async function deleteConversation(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.chatConversation(id));
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await apiClient.get<ListEnvelope<RawMessage>>(
    API_ENDPOINTS.chatMessages(conversationId),
  );
  return toList(res.data).map(toChatMessage);
}

/**
 * POST returns 202: it creates the user message and enqueues reply generation,
 * it does NOT return the assistant's reply. Callers observe the reply once it
 * lands via the chat_token/chat_message SSE events (see queries/chat.ts's
 * useMessages and app/lib/use-event-stream.ts), not by refetching `getMessages`
 * themselves.
 */
export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<ChatMessage> {
  const res = await apiClient.post<RawMessage>(
    API_ENDPOINTS.chatMessages(conversationId),
    {
      content,
    },
  );
  return toChatMessage(res.data);
}

/**
 * Shortcut into the same statement-ingestion pipeline as `POST /statements`
 * (same 202 contract, resolved via the statement_status SSE event rather
 * than polling), tagged to this conversation. Returns the assistant message
 * announcing the upload; the referenced statement is tracked through the
 * normal bank-statements queries.
 */
export async function uploadChatAttachment(
  conversationId: string,
  file: File,
  caption?: string,
): Promise<ChatMessage> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  // A caption typed alongside the file rides on THIS request so the backend can
  // record it as the user's message — sending it separately would race the
  // upload's "I've started processing" announcement.
  if (caption?.trim()) formData.append("text", caption.trim());
  const res = await apiClient.post<RawMessage>(
    API_ENDPOINTS.chatAttachments(conversationId),
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return toChatMessage(res.data);
}
