import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MonthPicker } from "@/components/budget/MonthPicker";

/**
 * The one month control for the whole "current standing" group of sections
 * (Insights, KPI strip, Progress+donut, Biggest activity) — arrows step one
 * month at a time, the calendar (MonthPicker) jumps to any month directly.
 * Both are gated to `availablePeriods` (months with at least one
 * transaction — see budget.tsx, which unions GET /analytics/monthly-summaries'
 * months with the current calendar month so a brand-new account with zero
 * transactions yet still has somewhere to land) rather than a plain
 * "not in the future" cutoff, per the "only months that have data" ask.
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
