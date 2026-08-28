import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ChatThinking } from "@/types/chat";

/**
 * Persisted "Thought for Ns" record of the analysis agent's tool-call
 * activity, attached to a message once its reply lands (use-event-stream.ts's
 * chat_message handler, via use-chat-tool-status-store's finish()) — the
 * permanent counterpart to ChatToolStatusList's live checklist, which is
 * cleared the moment the turn completes. Collapsed by default so finished
 * turns don't clutter the transcript, but the duration itself stays visible
 * in the header forever; expanding shows exactly which steps ran.
 */
export function ChatThinkingSummary({ thinking }: { thinking: ChatThinking }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const seconds = Math.max(Math.round(thinking.durationMs / 1000), 1);

  return (
    <div className="mb-1.5 w-full">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="text-base-content/50 hover:text-base-content/70 flex items-center gap-1 text-xs font-medium transition-colors"
      >
        {t("chat.thinking.done", { count: seconds })}
        {expanded ? (
          <ChevronUp data-no-flip className="size-3.5" />
        ) : (
          <ChevronDown data-no-flip className="size-3.5" />
        )}
      </button>
      {expanded && (
        <ul className="animate-entry mt-1.5 flex flex-col gap-1.5">
          {thinking.steps.map((step) => (
            <li
              key={step.callId}
              className="text-base-content/60 flex items-center gap-2 text-sm"
            >
              <Check data-no-flip className="text-success size-3.5 shrink-0" />
              <span>
                {t(`chat.toolStatus.${step.tool}`, {
                  defaultValue: t("chat.toolStatus.fallback"),
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
