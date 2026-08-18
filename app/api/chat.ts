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
  /** Null on a reply with no widget — the backend always sends the slot as
   *  `{type: null, payload: null}` rather than omitting it. */
  type: string | null;
  payload: unknown;
}

interface RawMessage {
  id: string;
  sender: string;
  content: string;
  stage: string | null;
  widget: RawWidget | null;
  references: RawReference[] | null;
  /** Null/omitted on a user message and on any assistant message predating
   *  this field — falls back to the static, tool-keyed chips in that case. */
  suggestions?: string[] | null;
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
  // `widget.type`, not `widget` itself: a reply with no widget still carries
  // the slot as `{type: null, payload: null}`, a truthy object. Testing the
  // object alone mints a tool call named `null` — no card renders, and worse,
  // isAwaitingReply (queries/chat.ts) reads it as "a reply has arrived".
  if (!raw.widget?.type || raw.sender !== "assistant") return undefined;
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
    // The AI service generates these alongside the reply; fall back to
    // static, topic-keyed chips only for older messages persisted before
    // this field existed (null/undefined `suggestions`).
    ...(role === "assistant"
      ? {
          suggestions: raw.suggestions?.length
            ? raw.suggestions
            : buildSuggestions(toolCall?.toolName),
        }
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
  suggestions?: string[] | null;
}): ChatMessage {
  return toChatMessage({
    id: payload.id,
    sender: "assistant",
    content: payload.content,
    stage: null,
    widget: payload.widget,
    references: payload.references,
    suggestions: payload.suggestions,
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
 * Overwrites a message's widget payload — used once a chat widget's own
 * confirm action (e.g. AllocationSliderTool) makes the widget itself the
 * source of truth for its result, so that persists across a real page
 * reload instead of only living in the client's query cache. Returns the
 * updated message; only `widget.payload` changes, never `type`.
 */
export async function updateMessageWidget(
  conversationId: string,
  messageId: string,
  payload: unknown,
): Promise<ChatMessage> {
  const res = await apiClient.patch<RawMessage>(
    API_ENDPOINTS.chatMessageWidget(conversationId, messageId),
    { payload },
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
