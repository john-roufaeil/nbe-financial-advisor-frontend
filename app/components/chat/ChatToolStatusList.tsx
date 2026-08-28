import { Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatToolStatusStore } from "@/store/use-chat-tool-status-store";

/**
 * Live "thinking" checklist for the analysis agent's tool-calling loop —
 * one row per `chat_tool_status` step, growing as tool calls start and
 * complete. Renders nothing (returns null) once the conversation has no
 * steps yet, or after the store is cleared on chat_message/chat_error —
 * ChatThread falls back to the plain 3-dot indicator in that gap.
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
  const steps = useChatToolStatusStore((s) =>
    conversationId ? s.byConversationId[conversationId] : undefined,
  );

  if (!steps || steps.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5 ps-10">
      {steps.map((step) => (
        <li
          key={step.callId}
          className="text-base-content/70 flex items-center gap-2 text-sm"
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
  );
}
