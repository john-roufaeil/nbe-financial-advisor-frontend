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
import { useChatStopStore } from "@/store/use-chat-stop-store";
import { useConversationTitleStore } from "@/store/use-conversation-title-store";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/constants/limits";
import {
  createChatAttachmentsAdapter,
  sendPendingChatAttachments,
} from "@/lib/attachments";
import {
  chatKeys,
  useConversations,
  useMessages,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
  stopChatGeneration,
  isAwaitingReply,
} from "@/queries/chat";
import type { ChatConversation, ChatMessage } from "@/types/chat";

/**
 * Referentially stable empty array for ExternalStoreThreadListAdapter's
 * archivedThreads — nothing in this app supports archiving conversations,
 * but a fresh `[]` literal recreated inside threadListAdapter's useMemo below
 * would still count as a "changed" reference on every recompute, same
 * problem the memo itself exists to avoid.
 */
const NO_ARCHIVED_THREADS: ExternalStoreThreadListAdapter["archivedThreads"] = [];

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
 * this flag the conversation list and current conversation's messages would
 * fetch on every page load regardless of whether chat is ever opened.
 */
export function useAppChatRuntime(active = true) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const setCurrentConversationId = useChatStore((s) => s.setCurrentConversationId);
  // Subscribed (not just read via getState()) so a stop click re-renders
  // this hook — useMessages' `select` (queries/chat.ts) already derives the
  // "Stopped generating." placeholder from this same store, but that
  // derivation only re-runs when something causes this component tree to
  // re-render in the first place.
  const isStoppedForCurrent = useChatStopStore((s) =>
    currentConversationId !== null
      ? s.stoppedConversationIds.has(currentConversationId)
      : false,
  );
  const derivedTitles = useConversationTitleStore((s) => s.byConversationId);
  const setConversationTitle = useConversationTitleStore((s) => s.setTitle);

  const { data: conversations = [] } = useConversations(active);
  const { data: rawMessages } = useMessages(currentConversationId, active);
  const messages = rawMessages ?? [];

  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const sendMessage = useSendMessage();
  const ensureConversation = useEnsureConversation();

  // Same ref-indirection as useEnsureConversation above: these mutation
  // functions aren't referentially stable across renders, so threadListAdapter's
  // useMemo below reads the latest one through a ref instead of listing it as
  // a dependency — otherwise the memo would recompute on effectively every
  // render, defeating the point of memoizing at all.
  const createConversationRef = useRef(createConversation.mutateAsync);
  createConversationRef.current = createConversation.mutateAsync;
  const deleteConversationRef = useRef(deleteConversation.mutate);
  deleteConversationRef.current = deleteConversation.mutate;

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

  const attachmentsAdapter = useMemo(() => createChatAttachmentsAdapter(), []);

  const isRunning =
    !isStoppedForCurrent && (sendMessage.isPending || isAwaitingReply(messages));

  const onNew = async (message: AppendMessage) => {
    const text = extractText(message);
    const attachments = extractAttachments(message);

    // A send that carries an attachment is uploaded HERE (not in the adapter's
    // send()), because this is the one place that has both the stashed file(s)
    // and the caption `text` — for every send path (Enter and button), unlike
    // the composer's button-only text snapshot. The upload records the user's
    // own message (the caption, or the file name when blank) followed by the
    // "I've started processing" announcement — one request, no separate racing
    // send. The typed caption is NOT also sent as its own chat message.
    if (attachments?.length) {
      const conversationId = await ensureConversation();
      await sendPendingChatAttachments(
        conversationId,
        text,
        attachments.map((a) => a.id),
        queryClient,
      );
      return;
    }

    if (!text.trim()) {
      throw new Error("Only text messages are supported for now");
    }
    // Backstop for text that reaches here without going through the composer
    // textarea's maxLength (a restored draft, a suggestion chip, a
    // programmatic setText) — the backend enforces this too (422), but
    // failing fast here skips the round trip.
    if (text.length > CHAT_MESSAGE_MAX_LENGTH) {
      throw new Error(`Message exceeds the ${CHAT_MESSAGE_MAX_LENGTH}-character limit`);
    }

    const conversationId = await ensureConversation();
    await sendMessage.mutateAsync({ conversationId, content: text });
  };

  // Wired to ComposerPrimitive.Cancel (ChatComposer.tsx) via the runtime's
  // `running` state — assistant-ui only shows/enables that button while
  // isRunning is true, so currentConversationId is guaranteed set here.
  // Client-side only (queries/chat.ts's stopChatGeneration) — there's no
  // backend endpoint to actually cancel generation.
  const onCancel = async () => {
    if (currentConversationId) stopChatGeneration(currentConversationId);
  };

  // Memoized because assistant-ui's thread-list core reference-compares
  // `threads`/`archivedThreads` on every setAdapter call (which runs every
  // render regardless) and rebuilds its internal thread-data map plus
  // notifies every subscriber whenever either differs — without this, a
  // fresh `conversations.map(...)` array on every render triggers that
  // rebuild continuously while useMessages re-renders on every streamed
  // chat_token delta during an awaited reply, even though
  // conversations/currentConversationId/derivedTitles are
  // themselves stable across those renders (React Query structural sharing,
  // zustand selectors) and nothing actually changed.
  const threadListAdapter: ExternalStoreThreadListAdapter = useMemo(
    () => ({
      threadId: currentConversationId ?? "",
      threads: conversations.map((c) => ({
        id: c.id,
        title: resolveConversationTitle(c, derivedTitles, t("chat.newChat")),
        status: "regular" as const,
      })),
      archivedThreads: NO_ARCHIVED_THREADS,
      onSwitchToNewThread: async () => {
        const conversation = await createConversationRef.current();
        setCurrentConversationId(conversation.id);
      },
      onSwitchToThread: (id) => setCurrentConversationId(id),
      // No rename endpoint in the current /chat contract.
      onRename: () => {},
      onArchive: () => {},
      onDelete: (id) => {
        deleteConversationRef.current(id);
        if (id === currentConversationId) setCurrentConversationId(null);
      },
    }),
    [currentConversationId, conversations, derivedTitles, t, setCurrentConversationId],
  );

  // Backs tool-call components' `addResult` (e.g. AllocationSliderTool
  // confirming its final values) — without this, useExternalStoreRuntime's
  // addToolResult throws ("Runtime does not support tool results.") since it
  // has no adapter callback to persist into, and any `addResult(...)` call
  // silently fails (thrown inside a mutation's onSuccess, with nothing
  // surfacing it) leaving the widget's local state as the only place the
  // update ever landed — lost on remount (e.g. navigating away and back).
  // Written straight into the query cache, same as the chat_message SSE
  // handler (use-event-stream.ts) does for a landed reply — this cache is
  // what convertMessage below reads on every render, and it's kept alive by
  // useMessages staying mounted (with `enabled: false`) in AppLayout while
  // navigated away, so it survives exactly the round trip this fixes.
  const onAddToolResult = useCallback(
    ({ messageId, result }: { messageId: string; result: unknown }) => {
      if (!currentConversationId) return;
      queryClient.setQueryData<ChatMessage[]>(
        chatKeys.messages(currentConversationId),
        (old) =>
          old?.map((m) =>
            m.id === messageId && m.toolCall
              ? { ...m, toolCall: { ...m.toolCall, result } }
              : m,
          ),
      );
    },
    [currentConversationId, queryClient],
  );

  return useExternalStoreRuntime({
    messages,
    isRunning,
    onNew,
    onCancel,
    onAddToolResult,
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
