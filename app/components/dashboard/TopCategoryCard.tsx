import { useTranslation } from "react-i18next";
import { useCategoryStyle } from "@/lib/use-category-style";
import { useNumberDisplay } from "@/lib/use-number-display";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { Money } from "@/components/shared/Money";
import type { BudgetCategory } from "@/types/dashboard";

/** Highest-spend category this period — BudgetSplitCard shows every category's
 * progress bar but never calls out which one dominates. Derived entirely from
 * data.budget.categories, already part of the useDashboard() response. */
export function TopCategoryCard({
  categories,
  currency,
}: {
  categories: BudgetCategory[];
  currency: string;
}) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const { icon } = useCategoryStyle();
  const currencyLabel = t(`currency.${currency}`, currency);
  const top = categories.filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent)[0];
  if (!top) return null;
  const Icon = icon(top.name);

  return (
    <div className="card border-base-300 bg-base-100 animate-entry h-full w-full border shadow-sm">
      <div className="flex items-center gap-2 p-3">
        <span className="bg-secondary/10 text-secondary grid size-8 shrink-0 place-items-center rounded-lg">
          <Icon data-no-flip className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base-content/60 truncate text-xs">
            {t("dashboard.topCategory.label")}
          </p>
          <p className="truncate text-sm font-semibold">
            <CategoryLabel category={top.name} type="expense" iconClassName="hidden" />
          </p>
        </div>
        <span className="bg-secondary/10 text-secondary shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          <Money>
            {formatN(top.spent)} {currencyLabel}
          </Money>
        </span>
      </div>
    </div>
  );
}
