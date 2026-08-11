import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/shared/Tooltip";
import type { IncomeStability } from "@/types/dashboard";

const TONE: Record<IncomeStability["label"], string> = {
  stable: "bg-success/10 text-success",
  variable: "bg-warning/10 text-warning",
  unstable: "bg-error/10 text-error",
};

/** Hidden entirely rather than shown as a fake "0" — null means the backend
 * has under 2 months of income history to compute this from, not a real score. */
export function IncomeStabilityBadge({
  stability,
}: {
  stability: IncomeStability | null;
}) {
  const { t } = useTranslation();
  if (!stability) return null;

  return (
    <Tooltip content={t("dashboard.stability.tooltip")}>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${TONE[stability.label]}`}
      >
        <Activity data-no-flip className="size-3.5" />
        {t("dashboard.stability.label")}: {t(`dashboard.stability.${stability.label}`)}
      </span>
    </Tooltip>
  );
}
