import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Route, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { dedupeThinkingStepsForDisplay } from "@/lib/chat-thinking";
import type { ChatThinking } from "@/types/chat";

/**
 * Persisted "Thought for Ns" record of one turn's thinking activity —
 * attached to a message once its reply lands (Message.thinking_json, see
 * api/chat.ts) — the permanent counterpart to ChatToolStatusList's live
 * checklist, which is cleared the moment the turn completes. Expanded by
 * default (every message, past and present) so the routing/tool detail is
 * immediately visible rather than hidden behind a click; the collapse
 * toggle stays so an individual summary can still be tidied away. Shows
 * which agent Maestro routed to (Route icon) plus which tools ran (Wrench
 * icon, deduped to one row per tool — see dedupeThinkingStepsForDisplay for
 * why the agent calling the same tool twice must not render twice).
 */
export function ChatThinkingSummary({ thinking }: { thinking: ChatThinking }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const seconds = Math.max(Math.round(thinking.durationMs / 1000), 1);
  const displaySteps = dedupeThinkingStepsForDisplay(thinking.steps);

  return (
    <div className="mb-1.5 w-full">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="text-base-content/70 hover:text-base-content flex items-center gap-1 text-sm font-semibold transition-colors"
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
          {displaySteps.map((step) =>
            step.kind === "agent" ? (
              <li
                key="agent"
                className="text-base-content/80 flex items-center gap-2 text-sm"
              >
                <Route data-no-flip className="text-primary size-3.5 shrink-0" />
                <span>
                  {t(`chat.agent.${step.agent}`, {
                    defaultValue: t("chat.agent.fallback"),
                  })}
                </span>
              </li>
            ) : (
              <li
                key={step.tool}
                className="text-base-content/80 flex items-center gap-2 text-sm"
              >
                <Wrench data-no-flip className="text-base-content/50 size-3.5 shrink-0" />
                <Check data-no-flip className="text-success size-3.5 shrink-0" />
                <span>
                  {t(`chat.toolStatus.${step.tool}`, {
                    defaultValue: t("chat.toolStatus.fallback"),
                  })}
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
