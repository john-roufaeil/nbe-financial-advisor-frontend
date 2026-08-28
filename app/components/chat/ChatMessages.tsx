import {
  ThreadPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  useMessage,
} from "@assistant-ui/react";
import { Copy, Check, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { chatToolComponents } from "@/components/chat/tools";
import { ChatFeedbackButton } from "@/components/chat/ChatFeedbackButton";
import { ChatStatementCard } from "@/components/chat/ChatStatementCard";
import { ChatThinkingSummary } from "@/components/chat/ChatThinkingSummary";
import { MarkdownText } from "@/components/chat/MarkdownText";
import { ToolPayloadError } from "@/components/chat/tools/ToolPayloadError";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Tooltip } from "@/components/shared/Tooltip";
import { useChatStore } from "@/store/use-chat-store";
import { useMessageHighlightStore } from "@/store/use-message-highlight-store";
import { useMessages } from "@/queries/chat";
import { useSendChatMessage } from "@/lib/use-chat-runtime";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { formatTime } from "@/lib/format";

/** Shared by both action bars below — assistant-ui's ActionBarPrimitive.Copy
 * reads from the nearest MessagePrimitive.Root, so it works unchanged
 * whichever role's message it's rendered inside. */
function CopyMessageButton() {
  const { t } = useTranslation();
  return (
    <Tooltip content={t("chat.copy")}>
      <ActionBarPrimitive.Copy
        aria-label={t("chat.copy")}
        className="btn btn-ghost btn-xs btn-square"
      >
        <MessagePrimitive.If copied={false}>
          <Copy className="size-3.5" />
        </MessagePrimitive.If>
        <MessagePrimitive.If copied>
          <Check data-no-flip className="text-success size-3.5" />
        </MessagePrimitive.If>
      </ActionBarPrimitive.Copy>
    </Tooltip>
  );
}

function AssistantActionBar() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="text-base-content/50 flex items-center gap-1 pt-1"
    >
      <CopyMessageButton />
      <ChatFeedbackButton />
    </ActionBarPrimitive.Root>
  );
}

function UserActionBar() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="text-base-content/40 flex items-center gap-1 pt-1"
    >
      <CopyMessageButton />
    </ActionBarPrimitive.Root>
  );
}

export function UserMessage() {
  const { t } = useTranslation();
  const id = useMessage((m) => m.id);
  const createdAt = useMessage((m) => m.createdAt);
  const content = useMessage((m) => m.content);
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const highlightedId = useMessageHighlightStore((s) => s.highlightedId);
  const highlightNonce = useMessageHighlightStore((s) => s.nonce);
  const isHighlighted = highlightedId === id;
  const text = content.map((p) => (p.type === "text" ? p.text : "")).join("");

  return (
    <MessagePrimitive.Root id={`msg-${id}`} className="flex justify-end">
      <div className="animate-message-in flex max-w-[80%] min-w-0 flex-col items-end">
        <div
          // Keyed on the highlight nonce so re-selecting the same message from
          // QuestionsNav restarts the flash instead of no-op'ing on unchanged props.
          key={isHighlighted ? highlightNonce : "static"}
          // selection:* overrides the app-wide ::selection (app.css —
          // background: primary, color: primary-content) specifically here:
          // this bubble's own resting colors ARE primary/primary-content, so
          // the global selection style is invisible against it otherwise.
          className={`bg-primary text-primary-content selection:bg-base-300 selection:text-base-content min-w-0 overflow-hidden rounded-xl rounded-ee-sm px-4 py-2.5 ${
            isHighlighted ? "animate-message-highlight" : ""
          }`}
        >
          {text && (
            <div className="wrap-anywhere whitespace-pre-wrap select-text">{text}</div>
          )}
        </div>
        <span className="text-base-content/40 mt-1 px-1 text-xs">
          {formatTime(createdAt, timeFormat, t)}
        </span>
        <UserActionBar />
      </div>
    </MessagePrimitive.Root>
  );
}

export function AssistantMessage() {
  const { t } = useTranslation();
  const id = useMessage((m) => m.id);
  const createdAt = useMessage((m) => m.createdAt);
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  // assistant-ui's runtime message carries no references, so look this message
  // up in our own cache by id (same approach SuggestedQuestions uses) to find a
  // statement attachment the assistant posted, and surface its pipeline status.
  const conversationId = useChatStore((s) => s.currentConversationId);
  const { data: messages } = useMessages(conversationId);
  const thisMessage = messages?.find((m) => m.id === id);
  const statementId = thisMessage?.references?.find(
    (r) => r.targetType === "statement",
  )?.targetId;
  return (
    <MessagePrimitive.Root id={`msg-${id}`}>
      <MessagePrimitive.If hasContent>
        <div className="animate-message-in flex w-full items-start gap-2.5">
          <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
            <Bot className="size-4.5" />
          </span>
          <div className="flex max-w-[80%] min-w-0 flex-col items-start">
            {thisMessage?.thinking && (
              <ChatThinkingSummary thinking={thisMessage.thinking} />
            )}
            <div className="w-full min-w-0 overflow-hidden wrap-anywhere select-text">
              {/* Thread-wide <ErrorBoundary> in chat.tsx only catches a crash
                  once — reopening this same conversation re-fetches the same
                  bad payload and crashes again, with no recovery short of
                  abandoning the conversation. Scoped here instead, a bad
                  widget's crash only takes out this one message's content;
                  the rest of the thread (and this message's own avatar/
                  timestamp/action bar around it) keeps rendering. */}
              <ErrorBoundary fallback={<ToolPayloadError />}>
                <MessagePrimitive.Parts
                  components={{
                    Text: MarkdownText,
                    tools: { by_name: chatToolComponents },
                  }}
                />
              </ErrorBoundary>
            </div>
            {statementId && <ChatStatementCard statementId={statementId} />}
            <span className="text-base-content/40 mt-1 px-1 text-xs">
              {formatTime(createdAt, timeFormat, t)}
            </span>
            <AssistantActionBar />
          </div>
        </div>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
}

const SUGGESTIONS = [
  "chat.suggestions.spending",
  "chat.suggestions.save",
  "chat.suggestions.transactions",
] as const;

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <ThreadPrimitive.Empty>
      <div className="animate-entry mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
        <span className="bg-primary/10 text-primary grid size-14 place-items-center rounded-lg">
          <Bot className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-semibold">{t("chat.empty.title")}</h2>
        <p className="text-base-content/60 mt-1 text-sm">{t("chat.empty.subtitle")}</p>
        <div className="mt-6 grid w-full gap-2 sm:grid-cols-3">
          {SUGGESTIONS.map((key) => (
            <ThreadPrimitive.Suggestion
              key={key}
              prompt={t(key)}
              method="replace"
              autoSend
              className="border-base-300 bg-base-100 hover:border-primary hover:bg-base-200 focus-visible:outline-primary/50 cursor-pointer rounded-xl border px-3 py-3 text-start text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-0"
            >
              {t(key)}
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
}

export function SuggestedQuestions() {
  const send = useSendChatMessage();
  const conversationId = useChatStore((s) => s.currentConversationId);
  const { data: messages } = useMessages(conversationId);
  const lastMessage = messages?.[messages.length - 1];
  const isRunning =
    lastMessage?.role === "assistant" && lastMessage.stage === "generating";

  if (isRunning || !lastMessage || lastMessage.role !== "assistant") {
    return null;
  }
  const suggestions = lastMessage.suggestions;
  if (!suggestions?.length) return null;

  return (
    <div className="animate-entry flex flex-wrap gap-2 ps-10.5">
      {suggestions.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => send(question)}
          className="border-base-300 bg-base-100 hover:border-primary hover:bg-base-200 focus-visible:outline-primary/50 cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
