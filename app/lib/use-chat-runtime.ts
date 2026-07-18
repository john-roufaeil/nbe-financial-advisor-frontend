import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
  type ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { useChatStore } from "@/store/use-chat-store";
import { useDataSourceStore } from "@/store/use-data-source-store";
import { useConversationTitleStore } from "@/store/use-conversation-title-store";
import { createChatAttachmentsAdapter } from "@/lib/attachments";
import {
  useConversations,
  useMessages,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
  isAwaitingReply,
} from "@/queries/chat";
import type { ChatConversation } from "@/types/chat";

/**
 * Resolves the conversation to send/upload into, creating one on first use.
 * Reads/writes the store directly (rather than the subscribed value) so the
 * returned function has a stable identity across renders — callers that
 * memoize on it (the attachments adapter) don't get rebuilt every render.
 */
function useEnsureConversation() {
  const createConversation = useCreateConversation();
  const mutateRef = useRef(createConversation.mutateAsync);
  mutateRef.current = createConversation.mutateAsync;

  return useCallback(async () => {
    const existing = useChatStore.getState().currentConversationId;
    if (existing) return existing;
    const conversation = await mutateRef.current();
    useChatStore.getState().setCurrentConversationId(conversation.id);
    return conversation.id;
  }, []);
}

/** Shared by the composer's onNew and by suggestion-chip clicks — both just ensure a conversation exists and send into it. */
export function useSendChatMessage() {
  const ensureConversation = useEnsureConversation();
  const sendMessage = useSendMessage();
  return async (text: string) => {
    const conversationId = await ensureConversation();
    await sendMessage.mutateAsync({ conversationId, content: text });
  };
}

/** assistant-ui only ever gives `AppendMessage.content[0]` as text when a text
 * part exists at all — an attachment-only send (no caption typed) has no
 * text part, so this must not assume index 0 is text. */
function extractText(message: AppendMessage): string {
  const part = message.content.find((c) => c.type === "text");
  return part && "text" in part ? part.text : "";
}

function extractAttachments(message: AppendMessage) {
  return message.attachments
    ?.filter((a) => a.type === "image" || a.type === "document")
    .map((a) => ({ id: a.id, type: a.type as "image" | "document", name: a.name }));
}

/**
 * The backend has no rename endpoint, so a conversation's `title` stays
 * empty forever unless derived client-side. Priority: the backend's own
 * title if it's ever populated, then the first user message (once loaded —
 * see the effect in useAppChatRuntime). Anything else falls back to
 * "New chat" rather than a numbered/date placeholder.
 */
function resolveConversationTitle(
  conversation: ChatConversation,
  derivedTitles: Record<string, string>,
  newChatLabel: string,
): string {
  return conversation.title || derivedTitles[conversation.id] || newChatLabel;
}

/**
 * `active` should be false whenever the chat page isn't the one on screen —
 * this runtime is created once in AppLayout (so the sidebar thread list and
 * AssistantRuntimeProvider survive navigating away from /chat), and without
 * this flag its message poll would keep hitting the backend every second
 * from every other route too.
 */
export function useAppChatRuntime(active = true) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const setCurrentConversationId = useChatStore((s) => s.setCurrentConversationId);
  const derivedTitles = useConversationTitleStore((s) => s.byConversationId);
  const setConversationTitle = useConversationTitleStore((s) => s.setTitle);

  const { data: conversations = [] } = useConversations();
  const { data: rawMessages } = useMessages(currentConversationId, active);
  const messages = rawMessages ?? [];

  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage();
  const ensureConversation = useEnsureConversation();

  // Land on an existing conversation once the list loads, instead of sitting
  // on an unselected thread when the user already has history.
  useEffect(() => {
    if (currentConversationId === null && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [currentConversationId, conversations, setCurrentConversationId]);

  // Derive a real title from the first user message once it's loaded — the
  // backend never supplies one (see resolveConversationTitle).
  useEffect(() => {
    if (!currentConversationId || derivedTitles[currentConversationId]) return;
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage?.text.trim()) {
      setConversationTitle(currentConversationId, firstUserMessage.text.slice(0, 40));
    }
  }, [currentConversationId, messages, derivedTitles, setConversationTitle]);

  const attachmentsAdapter = useMemo(
    () => createChatAttachmentsAdapter(ensureConversation, source, queryClient),
    [ensureConversation, source, queryClient],
  );

  const isRunning = sendMessage.isPending || isAwaitingReply(messages);

  const onNew = async (message: AppendMessage) => {
    const text = extractText(message);
    const attachments = extractAttachments(message);

    if (!text.trim()) {
      // Attachment-only send (no caption typed): the file already uploaded
      // via the attachments adapter, which creates its own assistant
      // announcement message — there's no text message left to send.
      if (attachments?.length) return;
      throw new Error("Only text messages are supported for now");
    }

    const conversationId = await ensureConversation();
    await sendMessage.mutateAsync({ conversationId, content: text, attachments });
  };

  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: currentConversationId ?? "",
    threads: conversations.map((c) => ({
      id: c.id,
      title: resolveConversationTitle(c, derivedTitles, t("chat.newChat")),
      status: "regular" as const,
    })),
    archivedThreads: [],
    onSwitchToNewThread: async () => {
      const conversation = await createConversation.mutateAsync();
      setCurrentConversationId(conversation.id);
    },
    onSwitchToThread: (id) => setCurrentConversationId(id),
    // No rename endpoint in the current /chat contract.
    onRename: () => {},
    onArchive: () => {},
    onDelete: (id) => {
      deleteConversation.mutate(id);
      if (id === currentConversationId) setCurrentConversationId(null);
    },
  };

  return useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
    convertMessage: (m): ThreadMessageLike => ({
      role: m.role,
      id: m.id,
      createdAt: new Date(m.createdAt),
      ...(m.attachments?.length
        ? {
            attachments: m.attachments.map((a) => ({
              id: a.id,
              type: a.type,
              name: a.name,
              status: { type: "complete" as const },
              content: [{ type: "text" as const, text: a.name }],
            })),
          }
        : {}),
      content: [
        ...(m.text ? [{ type: "text" as const, text: m.text }] : []),
        // A tool-call part on a non-assistant message hard-crashes
        // assistant-ui's runtime ("Unsupported user message part type:
        // tool-call") — api/chat.ts already gates this at the source, but
        // guard here too since it's cheap and this is the point a bad value
        // would blow up the whole thread.
        ...(m.toolCall && m.role === "assistant"
          ? [
              {
                type: "tool-call" as const,
                toolCallId: m.id,
                toolName: m.toolCall.toolName,
                args: m.toolCall.args,
                result: m.toolCall.result,
              },
            ]
          : []),
      ],
    }),
    adapters: {
      threadList: threadListAdapter,
      attachments: attachmentsAdapter,
    },
  });
}
