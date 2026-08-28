import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
 * Live "thinking" checklist for the analysis agent's tool-calling loop — a
 * ticking "Thinking for Ns" header plus one row per `chat_tool_status` step,
 * growing (each new row sliding up via .animate-entry) as tool calls start
 * and complete. Renders nothing once the conversation has no steps yet —
 * ChatThread falls back to the plain 3-dot indicator in that gap.
 *
 * This is only the *live* view — once the reply lands, use-event-stream.ts's
 * finish() snapshots this same data onto the message and clears the store,
 * so the persisted summary (ChatThinkingSummary) takes over from here
 * instead of this checklist just disappearing.
 *
 * The tool name is never shown raw — it's resolved through i18n with a
 * generic fallback, so an unmapped/future tool never leaks an internal
 * identifier to the user (see toolStatus.fallback in chat.json).
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

  return (
    <div className="flex flex-col gap-1.5 ps-10">
      <span className="text-base-content/50 text-xs font-medium">
        {t("chat.thinking.live", { count: Math.max(elapsedSeconds, 0) })}
      </span>
      <ul className="flex flex-col gap-1.5">
        {thinking.steps.map((step) => (
          <li
            key={step.callId}
            className="animate-entry text-base-content/70 flex items-center gap-2 text-sm"
          >
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
        ))}
      </ul>
    </div>
  );
}
