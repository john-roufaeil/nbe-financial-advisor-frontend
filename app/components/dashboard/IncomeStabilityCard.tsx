import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InsightTile } from "@/components/dashboard/InsightTile";
import type { IncomeStability } from "@/types/dashboard";

const TONE: Record<IncomeStability["label"], string> = {
  stable: "bg-success/10 text-success",
  variable: "bg-warning/10 text-warning",
  unstable: "bg-error/10 text-error",
};

/** Hidden entirely rather than shown as a fake "0" — null means the backend
 * has under 2 months of income history to compute this from, not a real score. */
export function IncomeStabilityCard({
  stability,
}: {
  stability: IncomeStability | null;
}) {
  const { t } = useTranslation();
  if (!stability) return null;
  const tone = TONE[stability.label];

  return (
    <InsightTile
      icon={Activity}
      tone={tone}
      label={t("dashboard.stability.label")}
      value={stability.score}
      tooltip={t("dashboard.stability.tooltip")}
      trailing={
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
          {t(`dashboard.stability.${stability.label}`)}
        </span>
      }
    />
  );
}
