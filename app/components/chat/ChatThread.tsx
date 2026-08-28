import { useEffect, useRef } from "react";
import { ThreadPrimitive } from "@assistant-ui/react";
import { Bot } from "lucide-react";
import { QuestionsNav } from "@/components/chat/QuestionsNav";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import {
  UserMessage,
  AssistantMessage,
  EmptyState,
  SuggestedQuestions,
} from "@/components/chat/ChatMessages";
import { ChatToolStatusList } from "@/components/chat/ChatToolStatusList";
import { ChatScrollButtons } from "@/components/chat/ChatScrollButtons";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { BankStatementDetailModal } from "@/components/bank-statements/BankStatementDetailModal";
import { useStatementReviewStore } from "@/store/use-statement-review-store";
import { useChatStore } from "@/store/use-chat-store";
import { useChatToolStatusStore } from "@/store/use-chat-tool-status-store";

export function ChatThread() {
  const { ref: viewportRef, atTop, atBottom } = useScrollEdges<HTMLDivElement>();
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const hasToolSteps = useChatToolStatusStore((s) =>
    currentConversationId
      ? (s.byConversationId[currentConversationId]?.steps.length ?? 0) > 0
      : false,
  );

  // One review modal for the whole thread, opened by any message's statement card via the store.
  // Native <dialog> "close" (Esc/backdrop/close button) resets the store so it can reopen later.
  const reviewModalRef = useRef<HTMLDialogElement>(null);
  const reviewStatementId = useStatementReviewStore((s) => s.statementId);
  const closeReview = useStatementReviewStore((s) => s.close);
  useEffect(() => {
    if (reviewStatementId) reviewModalRef.current?.showModal();
  }, [reviewStatementId]);
  useEffect(() => {
    const dialog = reviewModalRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", closeReview);
    return () => dialog.removeEventListener("close", closeReview);
  }, [closeReview]);

  return (
    <ThreadPrimitive.Root className="bg-base-100 flex h-full min-w-0 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <ThreadPrimitive.Viewport
          ref={viewportRef}
          className="h-full min-w-0 overflow-x-hidden overflow-y-auto"
        >
          <EmptyState />
          <div className="mx-auto flex w-full max-w-3xl min-w-0 flex-col gap-6 px-4 py-6">
            <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
            <ThreadPrimitive.If running>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
                    <Bot className="size-4.5" />
                  </span>
                  {!hasToolSteps && (
                    <div className="flex items-center gap-1.5">
                      <span className="bg-base-content/40 size-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                      <span className="bg-base-content/40 size-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                      <span className="bg-base-content/40 size-2 animate-bounce rounded-full" />
                    </div>
                  )}
                </div>
                <ChatToolStatusList conversationId={currentConversationId} />
              </div>
            </ThreadPrimitive.If>
            <SuggestedQuestions />
          </div>
        </ThreadPrimitive.Viewport>

        <QuestionsNav viewportRef={viewportRef} />

        <ChatScrollButtons viewportRef={viewportRef} atTop={atTop} atBottom={atBottom} />
      </div>

      <ChatComposer />

      <BankStatementDetailModal
        ref={reviewModalRef}
        bankStatementId={reviewStatementId}
      />
    </ThreadPrimitive.Root>
  );
}
