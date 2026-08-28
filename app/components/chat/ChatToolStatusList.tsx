import { useEffect, useState } from "react";
import { Check, Loader2, Route, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { dedupeThinkingStepsForDisplay } from "@/lib/chat-thinking";
import { useChatToolStatusStore } from "@/store/use-chat-tool-status-store";

/** Ticks once a second off a fixed start time, for a live "thinking for Ns"
 * counter — re-anchors to `startedAt` (not just +1 each tick) so a dropped/
 * throttled interval (e.g. a backgrounded tab) can't drift the displayed
 * value away from real elapsed time. */
function useElapsedSeconds(startedAt: number): number {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - startedAt) / 1000),
  );

  useEffect(() => {
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}

/**
 * Live "thinking" checklist for the current turn — a ticking "Thinking for
 * Ns" header inside a bordered card, plus one row for which agent Maestro
 * routed to (Route icon, from `chat_agent_selected`) followed by one row
 * per distinct tool the analysis agent's tool-calling loop calls (Wrench
 * icon plus a spinner/check, from `chat_tool_status`) — deduped to one row
 * per tool (dedupeThinkingStepsForDisplay), since the agent can legitimately
 * call the same tool more than once in a turn and that must not render as
 * the same phrase twice. New rows slide up via .animate-entry. Renders
 * nothing once the conversation has no steps yet — ChatThread falls back to
 * the plain 3-dot indicator in that gap.
 *
 * This is only the *live* view — once the reply lands, the persisted
 * Message.thinking_json (see api/chat.ts, ChatThinkingSummary) takes over
 * from here; use-event-stream.ts's chat_message handler just clears this
 * store rather than reading it back.
 *
 * Neither the tool name nor the agent's route name is ever shown raw — both
 * are resolved through i18n with a generic fallback, so an unmapped/future
 * one never leaks an internal identifier to the user (see
 * toolStatus.fallback / agent.fallback in chat.json).
 */
export function ChatToolStatusList({
  conversationId,
}: {
  conversationId: string | null;
}) {
  const { t } = useTranslation();
  const thinking = useChatToolStatusStore((s) =>
    conversationId ? s.byConversationId[conversationId] : undefined,
  );
  const elapsedSeconds = useElapsedSeconds(thinking?.startedAt ?? Date.now());

  if (!thinking || thinking.steps.length === 0) return null;
  const displaySteps = dedupeThinkingStepsForDisplay(thinking.steps);

  return (
    <div className="ps-10">
      <div className="border-base-300 bg-base-200/40 flex flex-col gap-1.5 rounded-lg border px-3 py-2.5">
        <span className="text-base-content/80 text-sm font-semibold">
          {t("chat.thinking.live", { count: Math.max(elapsedSeconds, 0) })}
        </span>
        <ul className="flex flex-col gap-1.5">
          {displaySteps.map((step) =>
            step.kind === "agent" ? (
              <li
                key="agent"
                className="animate-entry text-base-content/90 flex items-center gap-2 text-sm"
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
                className="animate-entry text-base-content/90 flex items-center gap-2 text-sm"
              >
                <Wrench data-no-flip className="text-base-content/50 size-3.5 shrink-0" />
                {step.status === "completed" ? (
                  <Check data-no-flip className="text-success size-3.5 shrink-0" />
                ) : (
                  <Loader2 data-no-flip className="size-3.5 shrink-0 animate-spin" />
                )}
                <span>
                  {t(`chat.toolStatus.${step.tool}`, {
                    defaultValue: t("chat.toolStatus.fallback"),
                  })}
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
