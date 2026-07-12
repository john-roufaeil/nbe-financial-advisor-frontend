import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
  type ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { useChatStore, type ChatState } from "@/store/use-chat-store";
import { chatAttachmentsAdapter } from "@/lib/attachments";
import {
  buildSpendingBreakdown,
  buildTransactionsList,
  buildSavingsSlider,
  buildSuggestions,
  wantsSpendingBreakdown,
  wantsTransactions,
  wantsSavingsPlan,
} from "@/lib/demo-financials";
import { MOCK_CHAT_LATENCY_MS } from "@/lib/constants/time";

function pickResponse(text: string): {
  text: string;
  toolCall?: ReturnType<typeof buildSpendingBreakdown>;
} {
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

type ChatStore = ChatState;

/** Shared by the composer's onNew and by suggestion-chip clicks — both just append a user message and a reply. */
async function sendMessage(
  store: ChatStore,
  text: string,
  attachments?: { id: string; type: "image" | "document"; name: string }[],
) {
  const threadId = store.currentThreadId;
  store.appendMessage(threadId, {
    id: crypto.randomUUID(),
    role: "user",
    text,
    ...(attachments?.length ? { attachments } : {}),
  });
  store.setRunning(true);
  // Loading dots show for this whole wait; the reply only appears once fully ready, fading in.
  await new Promise((r) => setTimeout(r, MOCK_CHAT_LATENCY_MS));

  const { text: replyText, toolCall } = pickResponse(text);
  store.appendMessage(threadId, {
    id: crypto.randomUUID(),
    role: "assistant",
    text: replyText,
    ...(toolCall ? { toolCall } : {}),
    suggestions: buildSuggestions(toolCall?.toolName),
  });
  store.setRunning(false);
}

/** For suggestion chips / suggested-question buttons that send a canned prompt without going through the composer. */
export function useSendChatMessage() {
  const store = useChatStore();
  return (text: string) => sendMessage(store, text);
}

export function useAppChatRuntime() {
  const store = useChatStore();
  const currentThread = store.threads[store.currentThreadId];
  const messages = currentThread?.messages ?? [];

  const onNew = async (message: AppendMessage) => {
    if (message.content[0]?.type !== "text")
      throw new Error("Only text messages are supported for now");
    const text = message.content[0].text;
    const attachments = message.attachments
      ?.filter((a) => a.type === "image" || a.type === "document")
      .map((a) => ({ id: a.id, type: a.type as "image" | "document", name: a.name }));
    await sendMessage(store, text, attachments);
  };

  const threadListAdapter: ExternalStoreThreadListAdapter = {
    threadId: store.currentThreadId,
    threads: store.order.map((id) => ({
      id,
      title: store.threads[id].title,
      status: "regular" as const,
    })),
    archivedThreads: [],
    onSwitchToNewThread: () => store.newThread(),
    onSwitchToThread: (id) => store.switchThread(id),
    onRename: (id, title) => store.renameThread(id, title),
    onArchive: () => {},
    onDelete: (id) => store.deleteThread(id),
  };

  return useExternalStoreRuntime({
    messages,
    isRunning: store.isRunning,
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
        ...(m.toolCall
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
      attachments: chatAttachmentsAdapter,
      feedback: { submit: () => {} },
    },
  });
}
