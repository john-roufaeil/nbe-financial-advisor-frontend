import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as chatApi from "@/api/chat";
import * as chatMock from "@/mocks/chat";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl } from "@/queries/shared";
import { toastApiError } from "@/lib/toast";
import { useMessageAttachmentsStore } from "@/store/use-message-attachments-store";
import { useChatStopStore } from "@/store/use-chat-stop-store";
import { CHAT_REPLY_TIMEOUT_MS } from "@/lib/constants/time";
import type { ChatAttachment, ChatMessage } from "@/types/chat";

export function impl(source: DataSource) {
  return pickImpl(source, chatApi, chatMock);
}

export const chatKeys = {
  all: [QUERY_ROOTS.chat] as const,
  conversations: (source: DataSource) =>
    [...chatKeys.all, "conversations", source] as const,
  messages: (conversationId: string, source: DataSource) =>
    [...chatKeys.all, "messages", source, conversationId] as const,
};

/**
 * Whether the conversation is still waiting on the assistant's reply. Judged
 * by content, not the backend's `stage` string — that vocabulary isn't
 * confirmed (see CHATBOT_BACKEND_INTEGRATION.md open questions), so matching
 * a specific literal like "complete" risks never recognizing completion if
 * the real value differs, leaving the poll (and the loading indicator)
 * stuck on forever. A user message with no reply yet, or an assistant
 * message with no content and no tool call, both mean "still waiting".
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
 * does land before the timeout — nothing to reset. A silent backend/AI
 * service failure (see CHATBOT_BACKEND_INTEGRATION.md) currently reports
 * only via an SSE event this app doesn't consume, so without this the poll
 * (and the loading indicator) would otherwise run forever with no error ever
 * surfacing.
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
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: chatKeys.conversations(source),
    queryFn: () => impl(source).getConversations(),
    enabled: active,
  });
}

/**
 * Sending a message only ever returns the user echo (202) — the assistant's
 * reply lands later. This poll is what surfaces it, mirroring how
 * useBankStatements polls while a statement is still processing.
 *
 * `active` gates both fetching and polling — the chat runtime is mounted
 * app-wide (AppLayout hosts it so the sidebar thread list and the
 * AssistantRuntimeProvider survive route changes), so without this a user
 * browsing Dashboard or Transactions would keep this hook polling the
 * backend every second in the background. Callers pass whether the chat
 * route is actually the active one.
 */
export function useMessages(conversationId: string | null, active = true) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? "", source),
    queryFn: () => impl(source).getMessages(conversationId as string),
    enabled: conversationId !== null && active,
    // There's no backend endpoint to actually cancel an in-flight reply
    // (see stopChatGeneration) — once a conversation is marked stopped
    // locally, polling for the reply that's still being generated
    // server-side just stops here so the UI doesn't keep waiting on it.
    refetchInterval: (query) =>
      active &&
      conversationId !== null &&
      !useChatStopStore.getState().stoppedConversationIds.has(conversationId) &&
      isAwaitingReply(query.state.data) &&
      !hasChatTimedOut(query.state.data)
        ? 1000
        : false,
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

      return withAttachments;
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: () => impl(source).createConversation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.all }),
    onError: (error) => toastApiError(error),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).deleteConversation(id),
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
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
      attachments?: ChatAttachment[];
    }) => impl(source).sendMessage(conversationId, content),
    onMutate: async ({ conversationId, content, attachments }) => {
      // Sending into a conversation that was previously stopped resumes
      // normal polling/loading UI for this new reply.
      useChatStopStore.getState().resume(conversationId);
      const key = chatKeys.messages(conversationId, source);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ChatMessage[]>(key);
      const optimistic: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: content,
        createdAt: Date.now(),
        stage: "complete",
        ...(attachments?.length ? { attachments } : {}),
      };
      queryClient.setQueryData<ChatMessage[]>(key, (old) => [...(old ?? []), optimistic]);
      return { previous, key };
    },
    onSuccess: (data, vars) => {
      if (vars.attachments?.length) {
        useMessageAttachmentsStore.getState().setAttachments(data.id, vars.attachments);
      }
    },
    onError: (error, _vars, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
      toastApiError(error);
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(vars.conversationId, source),
      });
    },
  });
}

/**
 * Stops an in-flight assistant reply — client-side only. There's no backend
 * endpoint to cancel generation (the backend runs the whole reply as one
 * Celery task with no cancellation hook), so this can't stop the assistant
 * from actually finishing its reply server-side. It only stops *this
 * client* from polling for and displaying that reply: the
 * "generating" indicator ends immediately, and useMessages' `select` swaps
 * the still-pending message for a local "Stopped generating." placeholder.
 * Sending a new message into the conversation (useSendMessage) resumes
 * normal polling.
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
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: ({ conversationId, file }: { conversationId: string; file: File }) =>
      impl(source).uploadChatAttachment(conversationId, file),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(vars.conversationId, source),
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.bankStatements] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.transactions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
    },
    onError: (error) => toastApiError(error),
  });
}
