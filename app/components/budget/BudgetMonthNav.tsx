import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MonthPicker } from "@/components/budget/MonthPicker";

/**
 * Shared month control for the "current standing" group (Insights, KPI strip,
 * Progress+donut, Biggest activity). Both arrows and MonthPicker are gated to
 * `availablePeriods` — months with data — not a plain "not in the future" cutoff.
 */
export function BudgetMonthNav({
  period,
  onPeriodChange,
  availablePeriods,
}: {
  period: string;
  onPeriodChange: (period: string) => void;
  availablePeriods: readonly string[];
}) {
  const { t } = useTranslation();
  const sorted = [...availablePeriods].sort();
  const index = sorted.indexOf(period);
  const prevPeriod = index > 0 ? sorted[index - 1] : null;
  const nextPeriod = index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => prevPeriod && onPeriodChange(prevPeriod)}
        disabled={!prevPeriod}
        aria-label={t("budget.nav.previousMonth")}
        className="btn btn-ghost btn-sm btn-square"
      >
        <ChevronLeft className="size-4" />
      </button>
      <MonthPicker
        value={period}
        onChange={onPeriodChange}
        availablePeriods={availablePeriods}
      />
      <button
        type="button"
        onClick={() => nextPeriod && onPeriodChange(nextPeriod)}
        disabled={!nextPeriod}
        aria-label={t("budget.nav.nextMonth")}
        className="btn btn-ghost btn-sm btn-square"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
