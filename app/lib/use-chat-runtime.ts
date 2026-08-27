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
import { updateMessageWidget } from "@/api/chat";
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
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastApiError, toastError, toastSuccess } from "@/lib/toast";

/**
 * Referentially stable empty array for ExternalStoreThreadListAdapter's
 * archivedThreads — nothing in this app supports archiving conversations,
 * but a fresh `[]` literal recreated inside threadListAdapter's useMemo below
 * would still count as a "changed" reference on every recompute, same
 * problem the memo itself exists to avoid.
 */
const NO_ARCHIVED_THREADS: ExternalStoreThreadListAdapter["archivedThreads"] = [];

/**
 * Resolves the conversation to send into, creating one on first use.
 * Reads/writes the store directly (rather than the subscribed value) so the
 * returned function has a stable identity across renders.
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
 * part exists at all, so this must not assume index 0 is text. */
function extractText(message: AppendMessage): string {
  const part = message.content.find((c) => c.type === "text");
  return part && "text" in part ? part.text : "";
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

  const isRunning =
    !isStoppedForCurrent && (sendMessage.isPending || isAwaitingReply(messages));

  const onNew = async (message: AppendMessage) => {
    const text = extractText(message);

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
  // update ever landed — lost on remount.
  //
  // Written into the query cache immediately (same as the chat_message SSE
  // handler in use-event-stream.ts does for a landed reply) so the widget
  // locks instantly and survives navigating away and back within the app —
  // that cache is kept alive by useMessages staying mounted (`enabled:
  // false`) in AppLayout while navigated away. PATCH .../widget/ then
  // persists the same value server-side so it also survives a real page
  // reload, not just in-app navigation; best-effort (the optimistic cache
  // write already stands on its own for the rest of this session if this
  // PATCH fails, e.g. offline — a later reload would then revert to the
  // model's original proposal, same as before this endpoint existed).
  const onAddToolResult = useCallback(
    ({ messageId, result }: { messageId: string; result: unknown }) => {
      if (!currentConversationId) return;
      const messageKey = chatKeys.messages(currentConversationId);
      const previousMessages = queryClient.getQueryData<ChatMessage[]>(messageKey);
      queryClient.setQueryData<ChatMessage[]>(messageKey, (old) =>
        old?.map((m) =>
          m.id === messageId && m.toolCall
            ? { ...m, toolCall: { ...m.toolCall, result } }
            : m,
        ),
      );
      void updateMessageWidget(currentConversationId, messageId, result)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.investmentScenarios] });
          if (
            result &&
            typeof result === "object" &&
            (result as { saved?: unknown }).saved === true
          ) {
            toastSuccess("toast.investmentScenarioSaved");
          }
        })
        .catch((error) => {
          // A failed save must not leave a card looking durably saved. Restore
          // the exact prior message and let the user retry.
          queryClient.setQueryData(messageKey, previousMessages);
          if (
            result &&
            typeof result === "object" &&
            (result as { saved?: unknown }).saved === true
          ) {
            toastError("toast.investmentScenarioSaveFailed");
          } else {
            toastApiError(error);
          }
        });
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
    },
  });
}
