import { useEffect, useRef, useState } from "react";
import {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  AttachmentPrimitive,
  ActionBarPrimitive,
  useMessage,
} from "@assistant-ui/react";
import {
  ArrowUp,
  Paperclip,
  X,
  Copy,
  Check,
  Square,
  Bot,
  ThumbsUp,
  ThumbsDown,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { chatToolComponents } from "@/components/chat/tools";
import { QuestionsNav } from "@/components/chat/QuestionsNav";
import { Tooltip } from "@/components/shared/Tooltip";
import { useChatStore } from "@/store/use-chat-store";
import { useSendChatMessage } from "@/lib/use-chat-runtime";
import { useTimeFormatStore } from "@/store/use-time-format-store";
import { formatTime } from "@/lib/format";

function ComposerAttachment() {
  const { t } = useTranslation();
  return (
    <AttachmentPrimitive.Root className="border-base-300 bg-base-100 flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
      <span className="max-w-40 truncate">
        <AttachmentPrimitive.Name />
      </span>
      <Tooltip content={t("actions.remove")}>
        <AttachmentPrimitive.Remove
          aria-label={t("actions.remove")}
          className="btn btn-ghost btn-xs btn-square"
        >
          <X className="size-3" />
        </AttachmentPrimitive.Remove>
      </Tooltip>
    </AttachmentPrimitive.Root>
  );
}

function MessageAttachmentChip({
  attachment,
}: {
  attachment: { type: string; name: string };
}) {
  const Icon = attachment.type === "image" ? ImageIcon : FileText;
  return (
    <span className="bg-primary-content/10 flex max-w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs">
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">{attachment.name}</span>
    </span>
  );
}

function AssistantActionBar() {
  const { t } = useTranslation();
  const feedback = useMessage((m) => m.metadata?.submittedFeedback?.type);
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
      <Tooltip content={t("chat.goodResponse")}>
        <ActionBarPrimitive.FeedbackPositive
          aria-label={t("chat.goodResponse")}
          className={`btn btn-ghost btn-xs btn-square ${feedback === "positive" ? "text-success" : ""}`}
        >
          <ThumbsUp
            className={`size-3.5 ${feedback === "positive" ? "fill-current" : ""}`}
          />
        </ActionBarPrimitive.FeedbackPositive>
      </Tooltip>
      <Tooltip content={t("chat.badResponse")}>
        <ActionBarPrimitive.FeedbackNegative
          aria-label={t("chat.badResponse")}
          className={`btn btn-ghost btn-xs btn-square ${feedback === "negative" ? "text-error" : ""}`}
        >
          <ThumbsDown
            className={`size-3.5 ${feedback === "negative" ? "fill-current" : ""}`}
          />
        </ActionBarPrimitive.FeedbackNegative>
      </Tooltip>
    </ActionBarPrimitive.Root>
  );
}

function UserMessage() {
  const { t } = useTranslation();
  const id = useMessage((m) => m.id);
  const createdAt = useMessage((m) => m.createdAt);
  const timeFormat = useTimeFormatStore((s) => s.format);
  return (
    <MessagePrimitive.Root id={`msg-${id}`} className="flex justify-end">
      <div className="animate-message-in flex max-w-[80%] min-w-0 flex-col items-end">
        <div className="bg-primary text-primary-content min-w-0 overflow-hidden rounded-2xl rounded-ee-sm px-4 py-2.5">
          <div className="flex flex-wrap gap-1.5 pb-2 empty:hidden">
            <MessagePrimitive.Attachments>
              {({ attachment }) => <MessageAttachmentChip attachment={attachment} />}
            </MessagePrimitive.Attachments>
          </div>
          <div className="wrap-anywhere whitespace-pre-wrap">
            <MessagePrimitive.Content />
          </div>
        </div>
        <span className="text-base-content/40 mt-1 px-1 text-xs">
          {formatTime(createdAt, timeFormat, t)}
        </span>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  const { t } = useTranslation();
  const id = useMessage((m) => m.id);
  const createdAt = useMessage((m) => m.createdAt);
  const isLast = useMessage((m) => m.isLast);
  const timeFormat = useTimeFormatStore((s) => s.format);
  return (
    <MessagePrimitive.Root id={`msg-${id}`} className="group">
      <MessagePrimitive.If hasContent>
        <div className="animate-message-in flex w-full items-start gap-2.5">
          <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
            <Bot className="size-4.5" />
          </span>
          <div className="flex max-w-[80%] min-w-0 flex-col items-start">
            <div className="w-full min-w-0 overflow-hidden leading-relaxed wrap-anywhere whitespace-pre-wrap">
              <MessagePrimitive.Parts
                components={{ tools: { by_name: chatToolComponents } }}
              />
            </div>
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

function EmptyState() {
  const { t } = useTranslation();
  return (
    <ThreadPrimitive.Empty>
      <div className="animate-entry mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
        <span className="bg-primary/10 text-primary grid size-14 place-items-center rounded-2xl">
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
              className="border-base-300 bg-base-100 hover:border-primary hover:bg-base-200 cursor-pointer rounded-xl border px-3 py-3 text-start text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              {t(key)}
            </ThreadPrimitive.Suggestion>
          ))}
        </div>
      </div>
    </ThreadPrimitive.Empty>
  );
}

function SuggestedQuestions() {
  const send = useSendChatMessage();
  const isRunning = useChatStore((s) => s.isRunning);
  const lastMessage = useChatStore((s) => {
    const messages = s.threads[s.currentThreadId]?.messages ?? [];
    return messages[messages.length - 1];
  });

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
          className="border-base-300 bg-base-100 hover:border-primary hover:bg-base-200 cursor-pointer rounded-full border px-3 py-1.5 text-xs transition-colors"
        >
          {question}
        </button>
      ))}
    </div>
  );
}

export function ChatThread() {
  const { t } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => {
      setAtTop(el.scrollTop <= 4);
      setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 4);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

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
              <div className="flex items-center gap-2.5">
                <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full">
                  <Bot className="size-4.5" />
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="bg-base-content/40 size-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                  <span className="bg-base-content/40 size-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                  <span className="bg-base-content/40 size-2 animate-bounce rounded-full" />
                </div>
              </div>
            </ThreadPrimitive.If>
            <SuggestedQuestions />
          </div>
        </ThreadPrimitive.Viewport>

        <QuestionsNav viewportRef={viewportRef} />

        <div className="absolute inset-e-6 bottom-3 z-10 flex flex-col gap-2">
          <Tooltip content={t("chat.nav.top")} position="start">
            <button
              type="button"
              disabled={atTop}
              onClick={() =>
                viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" })
              }
              className="btn btn-circle btn-sm border-base-300 bg-base-100 border shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              aria-label={t("chat.nav.top")}
            >
              <ChevronUp className="size-4" />
            </button>
          </Tooltip>
          <Tooltip content={t("chat.nav.bottom")} position="start">
            <button
              type="button"
              disabled={atBottom}
              onClick={() => {
                const el = viewportRef.current;
                if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
              }}
              className="btn btn-circle btn-sm border-base-300 bg-base-100 border shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              aria-label={t("chat.nav.bottom")}
            >
              <ChevronDown className="size-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="bg-base-100 animate-entry">
        <ComposerPrimitive.AttachmentDropzone className="data-dragging:border-primary mx-auto w-full max-w-3xl rounded-2xl data-dragging:border-2 data-dragging:border-dashed">
          <ComposerPrimitive.Root className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap gap-2 empty:hidden">
              <ComposerPrimitive.Attachments
                components={{ Attachment: ComposerAttachment }}
              />
            </div>
            <div className="border-base-300 bg-base-200 focus-within:border-primary flex items-end gap-2 rounded-2xl border p-2">
              <Tooltip content={t("chat.attach")} className="shrink-0">
                <ComposerPrimitive.AddAttachment asChild>
                  <button
                    type="button"
                    className="btn btn-ghost btn-circle btn-sm"
                    aria-label={t("chat.attach")}
                  >
                    <Paperclip className="size-5" />
                  </button>
                </ComposerPrimitive.AddAttachment>
              </Tooltip>
              <ComposerPrimitive.Input
                placeholder={t("chat.placeholder")}
                rows={1}
                className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-1 py-1.5 focus:outline-none"
              />
              <ThreadPrimitive.If running={false}>
                <Tooltip content={t("chat.send")} position="start" className="shrink-0">
                  <ComposerPrimitive.Send asChild>
                    <button
                      className="btn btn-primary btn-circle btn-sm"
                      aria-label={t("chat.send")}
                    >
                      <ArrowUp className="size-5" />
                    </button>
                  </ComposerPrimitive.Send>
                </Tooltip>
              </ThreadPrimitive.If>
              <ThreadPrimitive.If running>
                <Tooltip content={t("chat.stop")} position="start" className="shrink-0">
                  <ComposerPrimitive.Cancel asChild>
                    <button
                      className="btn btn-neutral btn-circle btn-sm"
                      aria-label={t("chat.stop")}
                    >
                      <Square className="size-4" />
                    </button>
                  </ComposerPrimitive.Cancel>
                </Tooltip>
              </ThreadPrimitive.If>
            </div>
          </ComposerPrimitive.Root>
        </ComposerPrimitive.AttachmentDropzone>
      </div>
    </ThreadPrimitive.Root>
  );
}
