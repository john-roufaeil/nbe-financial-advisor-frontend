import { useTranslation } from "react-i18next";
import {
  TriangleAlert,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useBudgetProgress } from "@/queries/budget";
import { useMonthlySummaries } from "@/queries/analytics";
import {
  computeBudgetInsights,
  type BudgetInsight,
  type InsightTone,
} from "@/lib/budget-insights";
import { previousPeriod } from "@/lib/budget-period";
import { EmptyState } from "@/components/shared/QueryState";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";

const TONE_ICON: Record<InsightTone, LucideIcon> = {
  critical: TriangleAlert,
  warning: AlertCircle,
  positive: TrendingUp,
  neutral: TrendingDown,
};

const TONE_CLASS: Record<InsightTone, string> = {
  critical: "border-error/30 bg-error/5",
  warning: "border-warning/30 bg-warning/5",
  positive: "border-success/30 bg-success/5",
  neutral: "border-base-300 bg-base-100",
};

const TONE_ICON_CLASS: Record<InsightTone, string> = {
  critical: "bg-error/15 text-error",
  warning: "bg-warning/15 text-warning",
  positive: "bg-success/15 text-success",
  neutral: "bg-base-200 text-base-content/60",
};

function InsightCard({ insight }: { insight: BudgetInsight }) {
  const { t } = useTranslation();
  const Icon = TONE_ICON[insight.tone];
  const category = insight.params?.category;
  const text = t(insight.key, {
    ...insight.params,
    ...(category ? { category: t(`common.categories.${category}`, category) } : {}),
  });

  return (
    <li
      className={`animate-entry flex items-start gap-3 rounded-xl border p-3 ${TONE_CLASS[insight.tone]}`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg ${TONE_ICON_CLASS[insight.tone]}`}
      >
        <Icon data-no-flip className="size-4" />
      </span>
      <p className="text-sm leading-snug">{text}</p>
    </li>
  );
}

/**
 * Derived analytical statements, not a restatement of the raw cards below it.
 * See app/lib/budget-insights.ts for the rules. Shares `period` with the rest
 * of the "current standing" group via budget.tsx's BudgetMonthNav.
 */
export function BudgetInsights({ period }: { period: string }) {
  const { t } = useTranslation();
  // budget has no plan yet -> 404s; that's a normal "nothing to derive
  // insights from" state here, not an error worth its own ErrorState.
  const { data: progress, isPending: progressPending } = useBudgetProgress(period);
  const prevPeriod = previousPeriod(period);
  const { data: summaries, isPending: summariesPending } = useMonthlySummaries(
    prevPeriod,
    period,
  );

  if (progressPending || summariesPending) return <ListSkeleton rows={2} />;

  const currentSummary = summaries?.find((s) => s.month.slice(0, 7) === period);
  const previousSummary = summaries?.find((s) => s.month.slice(0, 7) === prevPeriod);
  const insights = computeBudgetInsights({ progress, currentSummary, previousSummary });

  if (insights.length === 0) {
    return <EmptyState icon={Sparkles} label={t("budget.insights.empty")} />;
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </ul>
  );
}
