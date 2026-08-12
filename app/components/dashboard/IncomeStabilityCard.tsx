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
export function IncomeStabilityCard({
  stability,
}: {
  stability: IncomeStability | null;
}) {
  const { t } = useTranslation();
  if (!stability) return null;
  const tone = TONE[stability.label];

  return (
    <Tooltip content={t("dashboard.stability.tooltip")} className="w-full">
      <div className="card border-base-300 bg-base-100 animate-entry h-full w-full border shadow-sm">
        <div className="flex items-center gap-2 p-3">
          <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tone}`}>
            <Activity data-no-flip className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base-content/60 truncate text-xs">
              {t("dashboard.stability.label")}
            </p>
            <p className="text-base font-semibold tabular-nums">{stability.score}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
          >
            {t(`dashboard.stability.${stability.label}`)}
          </span>
        </div>
      </div>
    </Tooltip>
  );
}
