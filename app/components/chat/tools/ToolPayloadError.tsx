import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

// Shown when a tool widget's `result` fails Zod validation (LLM-originated payloads
// aren't as trustworthy as typed REST responses). Distinct from `result === undefined`,
// which just means still streaming and renders nothing.
export function ToolPayloadError() {
  const { t } = useTranslation();
  return (
    <div className="border-base-300 bg-base-100 text-base-content/60 animate-entry my-2 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
      <AlertTriangle className="text-warning size-4 shrink-0" />
      {t("chat.tools.payloadError")}
    </div>
  );
}
