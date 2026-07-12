import {
  ThreadPrimitive,
  ComposerPrimitive,
  AttachmentPrimitive,
} from "@assistant-ui/react";
import { ArrowUp, Paperclip, X, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";

function ComposerAttachment() {
  const { t } = useTranslation();
  return (
    <AttachmentPrimitive.Root className="border-base-300 bg-base-100 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
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

export function ChatComposer() {
  const { t } = useTranslation();
  return (
    <div className="bg-base-100 animate-entry">
      <ComposerPrimitive.AttachmentDropzone className="data-dragging:border-primary mx-auto w-full max-w-3xl rounded-xl data-dragging:border-2 data-dragging:border-dashed">
        <ComposerPrimitive.Root className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap gap-2 empty:hidden">
            <ComposerPrimitive.Attachments
              components={{ Attachment: ComposerAttachment }}
            />
          </div>
          <div className="border-base-300 bg-base-200 focus-within:border-primary flex items-end gap-2 rounded-lg border p-2">
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
  );
}
