import { useEffect, useReducer } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import * as chatApi from "@/api/chat";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastApiError } from "@/lib/toast";
import { useMessageAttachmentsStore } from "@/store/use-message-attachments-store";
import { useChatStopStore } from "@/store/use-chat-stop-store";
import { useChatStreamStore } from "@/store/use-chat-stream-store";
import { CHAT_REPLY_TIMEOUT_MS } from "@/lib/constants/time";
import type { ChatAttachment, ChatConversation, ChatMessage } from "@/types/chat";

export { chatApi };

export const chatKeys = {
  all: [QUERY_ROOTS.chat] as const,
  conversations: [QUERY_ROOTS.chat, "conversations"] as const,
  messages: (conversationId: string) =>
    [QUERY_ROOTS.chat, "messages", conversationId] as const,
};

/**
 * Moves (or inserts) a conversation to the front of the cached list —
 * mirrors the backend's own newest-active-first ordering
 * (`order_by("-last_message_at")`, core/views/conversations.py), which is
 * bumped on every message send AND every reply. Used instead of
 * invalidating chatKeys.conversations after those events: a full refetch
 * would carry no information the frontend actually reads (`preview` is
 * unused, `title` never changes server-side — see resolveConversationTitle,
 * use-chat-runtime.ts) beyond the one thing we already know for certain —
 * which conversation just became most-recently-active. No-ops if the list
 * was never fetched, or if `conversationId` is already first; it'll be
 * fetched in full, correctly ordered, whenever it's actually mounted.
 */
export function bumpConversationToFront(
  queryClient: QueryClient,
  conversationId: string,
  fallback?: ChatConversation,
) {
  queryClient.setQueryData<ChatConversation[]>(chatKeys.conversations, (old) => {
    if (!old || old[0]?.id === conversationId) return old;
    const conversation = old.find((c) => c.id === conversationId) ?? fallback;
    if (!conversation) return old;
    return [conversation, ...old.filter((c) => c.id !== conversationId)];
  });
}

/**
 * Whether the conversation is still waiting on the assistant's reply. Judged
 * by content, not the backend's `stage` string — that vocabulary isn't
 * confirmed (see CHATBOT_BACKEND_INTEGRATION.md open questions), so matching
 * a specific literal like "complete" risks never recognizing completion if
 * the real value differs, leaving the loading indicator stuck on forever. A
 * user message with no reply yet, or an assistant message with no content
 * and no tool call, both mean "still waiting".
 */
export function isAwaitingReply(messages: ChatMessage[] | undefined): boolean {
  const last = messages?.[messages.length - 1];
  if (!last) return false;
  if (last.role === "user") return true;
  return last.text.trim().length === 0 && !last.toolCall;
}

/**
 * Whether an awaited reply has gone on long enough to treat as failed rather
 * than just slow. Judged by the still-unanswered message's own createdAt,
 * not separate client state, so it resolves itself if the reply actually
 * does land before the timeout — nothing to reset. Belt-and-suspenders
 * alongside the chat_error SSE event (use-event-stream.ts) generate_chat_reply
 * publishes on a known AI-service failure: this is what still catches it if
 * an unrelated exception skips that publish entirely (see useMessages'
 * timeout-tick effect below), so the loading indicator can't get stuck
 * forever with no error ever surfacing.
 */
export function hasChatTimedOut(messages: ChatMessage[] | undefined): boolean {
  const last = messages?.[messages.length - 1];
  if (!last || !isAwaitingReply(messages)) return false;
  return Date.now() - last.createdAt > CHAT_REPLY_TIMEOUT_MS;
}

/**
 * `active` gates this the same way it gates useMessages below — the chat
 * runtime is mounted app-wide (AppLayout hosts it so the sidebar thread list
 * and AssistantRuntimeProvider survive route changes), so without this every
 * page, not just /chat, would fetch the conversation list on load.
 */
export function useConversations(active = true) {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: () => chatApi.getConversations(),
    enabled: active,
  });
}

/**
 * Sending a message only ever returns the user echo (202) — the assistant's
 * reply lands later, surfaced by the chat_token/chat_message/chat_error SSE
 * events (use-event-stream.ts) invalidating/updating this query, mirroring
 * how useBankStatements is nudged by the statement_status event.
 *
 * `active` gates fetching the same way it gates useConversations above — the
 * chat runtime is mounted app-wide (AppLayout hosts it so the sidebar thread
 * list and the AssistantRuntimeProvider survive route changes), so without
 * this a user browsing Dashboard or Transactions would keep this hook
 * fetching in the background. Callers pass whether the chat route is
 * actually the active one.
 */
export function useMessages(conversationId: string | null, active = true) {
  // Subscribing (not just reading via getState() below) is what makes each
  // chat_token SSE event (use-event-stream.ts) actually re-render this hook
  // so `select` recomputes with the latest partial text — the store itself
  // is otherwise invisible to React Query, which only reruns `select` on
  // this hook's own re-renders.
  const streamingText = useChatStreamStore((s) =>
    conversationId ? s.byConversationId[conversationId] : undefined,
  );
  const query = useQuery({
    queryKey: chatKeys.messages(conversationId ?? ""),
    queryFn: () => chatApi.getMessages(conversationId as string),
    enabled: conversationId !== null && active,
    // No refetchInterval — chat_token/chat_message/chat_error SSE events
    // (use-event-stream.ts) are what surface a reply now, invalidating this
    // query the moment generate_chat_reply (core/tasks/conversations.py)
    // finishes either way.
    select: (messages) => {
      // The server never echoes attachments back on a message (see
      // useSendMessage) — restore them from the local store keyed by real
      // message id, so the chip a user sent alongside a file survives the
      // refetch that replaces the optimistic entry.
      const stored = useMessageAttachmentsStore.getState().byMessageId;
      const withAttachments = messages.map((m) =>
        m.attachments?.length || !stored[m.id] ? m : { ...m, attachments: stored[m.id] },
      );

      // Once stopped, a still-pending (empty-text) last message is relabeled
      // locally so isAwaitingReply() and the running/loading UI treat it as
      // finished — the real reply may still land server-side later, but this
      // stops the UI from looking like it's still generating.
      if (
        conversationId &&
        useChatStopStore.getState().stoppedConversationIds.has(conversationId)
      ) {
        const last = withAttachments[withAttachments.length - 1];
        if (last && isAwaitingReply(withAttachments)) {
          const stoppedMessage: ChatMessage = {
            id: `stopped-${conversationId}`,
            role: "assistant",
            text: "Stopped generating.",
            createdAt: Date.now(),
            stage: "complete",
          };
          return last.role === "assistant"
            ? [...withAttachments.slice(0, -1), stoppedMessage]
            : [...withAttachments, stoppedMessage];
        }
      }

      if (hasChatTimedOut(withAttachments)) {
        const last = withAttachments[withAttachments.length - 1];
        const timedOutMessage: ChatMessage = {
          id: `timed-out-${conversationId}`,
          role: "assistant",
          text: "Something went wrong and no reply arrived. Please try sending your message again.",
          createdAt: Date.now(),
          stage: "complete",
        };
        return last.role === "assistant"
          ? [...withAttachments.slice(0, -1), timedOutMessage]
          : [...withAttachments, timedOutMessage];
      }

      // Streamed chat_token deltas (use-event-stream.ts), overlaid as a
      // live-updating assistant bubble ahead of the terminal chat_message
      // event that replaces it via cache invalidation. Guarded on the real
      // (pre-overlay) data still being awaited, so this can't loop back on
      // its own synthetic id or resurrect a genuinely finished reply.
      if (streamingText && isAwaitingReply(withAttachments)) {
        const last = withAttachments[withAttachments.length - 1];
        const streamingMessage: ChatMessage = {
          id: `streaming-${conversationId}`,
          role: "assistant",
          text: streamingText,
          createdAt: Date.now(),
        };
        return last.role === "assistant"
          ? [...withAttachments.slice(0, -1), streamingMessage]
          : [...withAttachments, streamingMessage];
      }

      return withAttachments;
    },
  });

  // A local, network-free timer — NOT polling: it never touches the backend,
  // it just forces a re-render once a second so hasChatTimedOut's
  // Date.now() comparison actually gets re-evaluated over time (nothing
  // else would trigger that recheck once refetchInterval is gone). Runs
  // only while genuinely awaiting a reply, which is the sole remaining gap
  // in the SSE contract: generate_chat_reply (core/tasks/conversations.py)
  // only publishes chat_error from inside its `except AIServiceError`
  // branch, so an unrelated exception (e.g. a DB error persisting the
  // reply) would otherwise leave this awaiting forever with no event ever
  // arriving to end it. Stops itself once select() above swaps in the
  // timed-out placeholder, since that placeholder is no longer "awaiting".
  const [, forceTick] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    if (!active || conversationId === null || !isAwaitingReply(query.data)) return;
    const id = setInterval(forceTick, 1000);
    return () => clearInterval(id);
  }, [active, conversationId, query.data]);

  return query;
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.createConversation(),
    onSuccess: (data) => {
      // A brand-new conversation always starts empty — seed that directly
      // instead of letting useMessages' first mount pay for a GET
      // .../messages that could only ever come back [].
      queryClient.setQueryData(chatKeys.messages(data.id), []);
      bumpConversationToFront(queryClient, data.id, data);
    },
    onError: (error) => toastApiError(error),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
    onError: (error) => toastApiError(error),
  });
}

/**
 * Takes the conversation id per-call (not bound at hook-creation time) so a
 * conversation created moments earlier in the same action can be sent into
 * immediately, without waiting on a re-render. No success toast — a toast on
 * every chat message would be noise. Optimistically appends the user message
 * so it shows instantly instead of waiting on the round trip.
 *
 * `attachments` are display-only here (already uploaded separately via the
 * attachments adapter, which is what actually sends the file) — POST
 * .../messages/ only takes `{ content }`, so the backend has no field
 * linking a specific text message to a file. `onSuccess` records them into
 * useMessageAttachmentsStore against the real message id the backend hands
 * back, so useMessages' `select` can restore the chip once the refetch
 * replaces this optimistic entry.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
      attachments?: ChatAttachment[];
    }) => chatApi.sendMessage(conversationId, content),
    onMutate: async ({ conversationId, content, attachments }) => {
      // Sending into a conversation that was previously stopped resumes
      // the normal awaiting/loading UI for this new reply.
      useChatStopStore.getState().resume(conversationId);
      const key = chatKeys.messages(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatMessage[]>(key);
      const optimisticId = crypto.randomUUID();
      const optimistic: ChatMessage = {
        id: optimisticId,
        role: "user",
        text: content,
        createdAt: Date.now(),
        stage: "complete",
        ...(attachments?.length ? { attachments } : {}),
      };
      queryClient.setQueryData<ChatMessage[]>(key, (old) => [...(old ?? []), optimistic]);
      return { previous, key, optimisticId };
    },
    // Swaps the optimistic entry for the real persisted message (real id,
    // server content) directly from the POST response, instead of the old
    // approach of invalidating .../messages and paying for a full refetch
    // just to learn what this response already told us.
    onSuccess: (data, vars, context) => {
      queryClient.setQueryData<ChatMessage[]>(context.key, (old) =>
        old?.map((m) => (m.id === context.optimisticId ? data : m)),
      );
      if (vars.attachments?.length) {
        useMessageAttachmentsStore.getState().setAttachments(data.id, vars.attachments);
      }
      // Mirrors the backend bumping Conversation.last_message_at on every
      // message send (core/views/conversations.py) — moves this
      // conversation to the top of the sidebar list without a separate GET
      // /chat/conversations, since we already know the outcome.
      bumpConversationToFront(queryClient, vars.conversationId);
    },
    onError: (error, _vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
      toastApiError(error);
    },
  });
}

/**
 * Stops an in-flight assistant reply — client-side only. There's no backend
 * endpoint to cancel generation (the backend runs the whole reply as one
 * Celery task with no cancellation hook), so this can't stop the assistant
 * from actually finishing its reply server-side. It only stops *this
 * client* from awaiting and displaying that reply: the "generating"
 * indicator ends immediately, and useMessages' `select` swaps the
 * still-pending message for a local "Stopped generating." placeholder.
 * Sending a new message into the conversation (useSendMessage) resumes
 * normal awaiting.
 */
export function stopChatGeneration(conversationId: string): void {
  useChatStopStore.getState().stop(conversationId);
}

/**
 * Uploading a bank statement from chat feeds the same ledger the statements
 * pipeline commits to, so its queries are invalidated alongside the
 * conversation's messages (the assistant's upload-announcement message).
 */
export function useUploadChatAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, file }: { conversationId: string; file: File }) =>
      chatApi.uploadChatAttachment(conversationId, file),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(vars.conversationId),
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.bankStatements] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.transactions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
    },
    onError: (error) => toastApiError(error),
  });
}
