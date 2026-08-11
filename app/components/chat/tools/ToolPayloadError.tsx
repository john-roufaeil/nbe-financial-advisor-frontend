import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Shown instead of a tool widget whose `result` failed Zod validation — an
 * LLM-originated payload is less trustworthy shape-wise than a typed REST
 * response, so a mismatch here is a real possibility, not just defensive
 * paranoia. Distinct from `result === undefined` (still streaming in,
 * renders nothing yet): this is for a payload that arrived but doesn't
 * match the shape this widget expects.
 */
export function ToolPayloadError() {
  const { t } = useTranslation();
  return (
    <div className="border-base-300 bg-base-100 text-base-content/60 animate-entry my-2 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
      <AlertTriangle className="text-warning size-4 shrink-0" />
      {t("chat.tools.payloadError")}
    </div>
  );
}
