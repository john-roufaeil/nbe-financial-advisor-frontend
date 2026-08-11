import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { PiggyBank } from "lucide-react";
import { useBudgetProgress } from "@/queries/budget";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { Money } from "@/components/shared/Money";
import { formatMoney } from "@/lib/format";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";
import {
  isSavingsCategory,
  statusSentiment,
  type StatusSentiment,
} from "@/lib/budget-category-semantics";

const SENTIMENT_BAR_CLASS: Record<StatusSentiment, string> = {
  good: "bg-success",
  watch: "bg-warning",
  bad: "bg-error",
};

const SENTIMENT_BADGE_CLASS: Record<StatusSentiment, string> = {
  good: "badge-success",
  watch: "badge-warning",
  bad: "badge-error",
};

export function BudgetProgressSection({ period }: { period: string }) {
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = useBudgetProgress(period);

  const noBudgetYet = isAxiosError(error) && error.response?.status === 404;

  return (
    <div className="border-base-300 bg-base-100 animate-entry flex flex-col gap-4 rounded-xl border p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
          <PiggyBank data-no-flip className="size-4" />
        </span>
        {t("budget.progress.title")}
      </h2>

      {isPending ? (
        <CardSkeleton icon={PiggyBank} className="border-none p-0 shadow-none" />
      ) : noBudgetYet ? (
        <EmptyState icon={PiggyBank} label={t("budget.progress.noBudget")} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.categories.length === 0 ? (
        <EmptyState label={t("budget.progress.empty")} />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex justify-center sm:shrink-0">
            <CategoryDonutChart
              slices={data.categories.map((c) => ({
                name: c.category,
                value: c.actualAmount,
              }))}
              centerLabel={t("budget.progress.spent")}
              centerValue={formatMoney(
                data.categories.reduce((sum, c) => sum + c.actualAmount, 0),
              )}
            />
          </div>
          <ul className="flex min-w-0 flex-1 flex-col gap-3">
            {data.categories.map((c) => {
              const sentiment = statusSentiment(c.category, c.status);
              const savings = isSavingsCategory(c.category);
              return (
                <li key={c.category} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <CategoryLabel
                      category={c.category}
                      type="expense"
                      className="font-medium"
                    />
                    <span className="flex items-center gap-2">
                      <Money className="tabular-nums">
                        {formatMoney(c.actualAmount)} / {formatMoney(c.allocatedAmount)}
                      </Money>
                      <span
                        className={`badge badge-sm ${SENTIMENT_BADGE_CLASS[sentiment]}`}
                      >
                        {t(
                          `budget.progress.status.${savings ? "savings" : "spend"}.${sentiment}`,
                        )}
                      </span>
                    </span>
                  </div>
                  <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${SENTIMENT_BAR_CLASS[sentiment]}`}
                      style={{ width: `${Math.min(100, c.percentageUsed)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
