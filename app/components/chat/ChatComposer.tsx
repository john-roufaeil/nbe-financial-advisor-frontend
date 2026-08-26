import { useEffect } from "react";
import {
  ThreadPrimitive,
  ComposerPrimitive,
  useComposer,
  useComposerRuntime,
} from "@assistant-ui/react";
import { ArrowUp, Square } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import {
  captureComposerTextForRestore,
  registerComposerTextRestore,
} from "@/lib/composer-text-recovery";
import { useComposerPromptHistory } from "@/lib/use-composer-prompt-history";
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/constants/limits";
import { ConsentRequiredOverlay } from "@/components/shared/ConsentRequiredOverlay";
import { useConsentStatus } from "@/queries/consent";

// Only surfaced once the user is close to the cap — showing "0/4000" from
// the first keystroke would just be noise.
const CHAR_COUNT_VISIBLE_THRESHOLD = 100;

function ComposerCharCount() {
  const text = useComposer((c) => c.text);
  const remaining = CHAT_MESSAGE_MAX_LENGTH - text.length;
  if (remaining > CHAR_COUNT_VISIBLE_THRESHOLD) return null;

  return (
    <span
      className={`shrink-0 self-end px-1 pb-1.5 text-xs tabular-nums ${
        remaining < 0 ? "text-error" : "text-base-content/60"
      }`}
    >
      {text.length}/{CHAT_MESSAGE_MAX_LENGTH}
    </span>
  );
}

function ComposerSendButton() {
  const { t } = useTranslation();
  const composerRuntime = useComposerRuntime();
  const canSend = useComposer((c) => c.canSend);

  useEffect(() => {
    registerComposerTextRestore((text) => composerRuntime.setText(text));
    return () => registerComposerTextRestore(null);
  }, [composerRuntime]);

  return (
    <Tooltip content={t("chat.send")} position="start" className="shrink-0">
      <button
        type="button"
        disabled={!canSend}
        onClick={() => {
          captureComposerTextForRestore(composerRuntime.getState().text);
          composerRuntime.send();
        }}
        className="btn btn-primary btn-circle btn-sm"
        aria-label={t("chat.send")}
      >
        <ArrowUp data-no-flip className="size-5" />
      </button>
    </Tooltip>
  );
}

export function ChatComposer() {
  const { t } = useTranslation();
  const handleHistoryKeyDown = useComposerPromptHistory();
  const { isActive: canChat, isPending: consentPending } =
    useConsentStatus("data_processing");

  if (!consentPending && !canChat) {
    return (
      <div className="bg-base-100 animate-entry">
        <ConsentRequiredOverlay className="mx-auto w-full max-w-3xl" />
      </div>
    );
  }

  return (
    <div className="bg-base-100 animate-entry">
      <ComposerPrimitive.Root className="mx-auto flex w-full max-w-3xl flex-col gap-2 p-4">
        <div className="border-base-300 bg-base-200 focus-within:border-primary flex items-end gap-2 rounded-lg border p-2">
          <ComposerPrimitive.Input
            placeholder={t("chat.placeholder")}
            rows={1}
            maxLength={CHAT_MESSAGE_MAX_LENGTH}
            onKeyDown={handleHistoryKeyDown}
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-1 py-1.5 focus:outline-none"
          />
          <ComposerCharCount />
          <ThreadPrimitive.If running={false}>
            <ComposerSendButton />
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
    </div>
  );
}
