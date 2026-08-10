import {
  ThreadPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  useMessage,
} from "@assistant-ui/react";
import { Copy, Check, Bot, Image as ImageIcon, FileText, Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";
import { chatToolComponents } from "@/components/chat/tools";
import { ChatFeedbackButton } from "@/components/chat/ChatFeedbackButton";
import { ChatStatementCard } from "@/components/chat/ChatStatementCard";
import { MarkdownText } from "@/components/chat/MarkdownText";
import { Tooltip } from "@/components/shared/Tooltip";
import { useChatStore } from "@/store/use-chat-store";
import { useMessages } from "@/queries/chat";
import { useSendChatMessage } from "@/lib/use-chat-runtime";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { formatTime } from "@/lib/format";

function MessageAttachmentChip({
  attachment,
}: {
  attachment: { type: string; name: string };
}) {
  const Icon = attachment.type === "image" ? ImageIcon : FileText;
  return (
    <span className="bg-primary-content/10 flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{attachment.name}</span>
    </span>
  );
}

// The backend records a chat-uploaded statement as a user message whose text is
// a "📎 <filename>" line (plus the caption below, if any) — a stopgap until the
// message model carries real attachments. Pull that line out and render it as a
// chip that reads as clickable; wiring an actual click target waits on that
// backend change.
const FILE_LINE_PREFIX = /^📎\s*/;

function UserUploadChip({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="bg-primary-content/10 hover:bg-primary-content/20 group flex max-w-full cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs transition-colors"
    >
      <Paperclip className="size-3.5 shrink-0" />
      <span className="truncate group-hover:underline">{name}</span>
    </span>
  );
}

function AssistantActionBar() {
  const { t } = useTranslation();
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="never"
      className="text-base-content/50 flex items-center gap-1 pt-1"
    >
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
      <ChatFeedbackButton />
    </ActionBarPrimitive.Root>
  );
}

export function UserMessage() {
  const { t } = useTranslation();
  const id = useMessage((m) => m.id);
  const createdAt = useMessage((m) => m.createdAt);
  const content = useMessage((m) => m.content);
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);

  // Split the "📎 <filename>" line(s) the upload flow prepends off from the rest
  // of the text, so the file renders as a chip above the caption (a plain text
  // message has no such line and just renders as the caption).
  const text = content.map((p) => (p.type === "text" ? p.text : "")).join("");
  const lines = text.split("\n");
  const fileNames = lines
    .filter((l) => FILE_LINE_PREFIX.test(l))
    .map((l) => l.replace(FILE_LINE_PREFIX, ""));
  const caption = lines.filter((l) => !FILE_LINE_PREFIX.test(l)).join("\n");

  return (
    <MessagePrimitive.Root id={`msg-${id}`} className="flex justify-end">
      <div className="animate-message-in flex max-w-[80%] min-w-0 flex-col items-end">
        <div className="bg-primary text-primary-content min-w-0 overflow-hidden rounded-xl rounded-ee-sm px-4 py-2.5">
          <div className="flex flex-wrap gap-1.5 pb-2 empty:hidden">
            <MessagePrimitive.Attachments>
              {({ attachment }) => <MessageAttachmentChip attachment={attachment} />}
            </MessagePrimitive.Attachments>
            {fileNames.map((name, i) => (
              <UserUploadChip key={i} name={name} />
            ))}
          </div>
          {caption && (
            <div className="wrap-anywhere whitespace-pre-wrap select-text">{caption}</div>
          )}
        </div>
        <span className="text-base-content/40 mt-1 px-1 text-xs">
          {formatTime(createdAt, timeFormat, t)}
        </span>
      </div>
    </MessagePrimitive.Root>
  );
}

export function AssistantMessage() {
  const { t } = useTranslation();
  const id = useMessage((m) => m.id);
  const createdAt = useMessage((m) => m.createdAt);
  const isLast = useMessage((m) => m.isLast);
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  // assistant-ui's runtime message carries no references, so look this message
  // up in our own cache by id (same approach SuggestedQuestions uses) to find a
  // statement attachment the assistant posted, and surface its pipeline status.
  const conversationId = useChatStore((s) => s.currentConversationId);
  const { data: messages } = useMessages(conversationId);
  const statementId = messages
    ?.find((m) => m.id === id)
    ?.references?.find((r) => r.targetType === "statement")?.targetId;
  return (
    <MessagePrimitive.Root id={`msg-${id}`} className="group">
      <MessagePrimitive.If hasContent>
        <div className="animate-message-in flex w-full items-start gap-2.5">
          <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
            <Bot className="size-4.5" />
          </span>
          <div className="flex max-w-[80%] min-w-0 flex-col items-start">
            <div className="w-full min-w-0 overflow-hidden wrap-anywhere select-text">
              <MessagePrimitive.Parts
                components={{
                  Text: MarkdownText,
                  tools: { by_name: chatToolComponents },
                }}
              />
            </div>
            {statementId && <ChatStatementCard statementId={statementId} />}
            <span className="text-base-content/40 mt-1 px-1 text-xs">
              {formatTime(createdAt, timeFormat, t)}
            </span>
            <div
              className={`grid w-full transition-[grid-template-rows] duration-200 ease-out ${
                isLast
                  ? "grid-rows-[1fr]"
                  : "grid-rows-[0fr] group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr]"
              }`}
            >
              <div className="overflow-hidden">
                <AssistantActionBar />
              </div>
            </div>
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
