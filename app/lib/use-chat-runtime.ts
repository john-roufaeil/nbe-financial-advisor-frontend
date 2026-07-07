import {
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
  type ExternalStoreThreadListAdapter,
} from "@assistant-ui/react";
import { useChatStore } from "@/store/use-chat-store";
import { chatAttachmentsAdapter } from "@/lib/attachments";
import { buildSpendingBreakdown, wantsSpendingBreakdown } from "@/lib/demo-financials";

export function useAppChatRuntime() {
  const store = useChatStore();
  const currentThread = store.threads[store.currentThreadId];
  const messages = currentThread?.messages ?? [];

  const onNew = async (message: AppendMessage) => {
    if (message.content[0]?.type !== "text")
      throw new Error("Only text messages are supported for now");
    const text = message.content[0].text;
    const threadId = store.currentThreadId;
    const attachments = message.attachments
      ?.filter((a) => a.type === "image" || a.type === "document")
      .map((a) => ({ id: a.id, type: a.type as "image" | "document", name: a.name }));
    store.appendMessage(threadId, {
      id: crypto.randomUUID(),
      role: "user",
      text,
      ...(attachments?.length ? { attachments } : {}),
    });
    store.setRunning(true);
    await new Promise((r) => setTimeout(r, 600));

    if (wantsSpendingBreakdown(text)) {
      store.appendMessage(threadId, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Here's how your spending breaks down across categories. This is placeholder data — no backend is connected yet.",
        toolCall: buildSpendingBreakdown(),
      });
    } else {
      store.appendMessage(threadId, {
        id: crypto.randomUUID(),
        role: "assistant",
        text: `Placeholder response. You said: "${text}". No backend connected yet. Try asking about your spending or budget to see a live tool card.`,
      });
    }
    store.setRunning(false);
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
