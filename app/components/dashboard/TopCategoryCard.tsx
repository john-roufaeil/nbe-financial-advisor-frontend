import { useTranslation } from "react-i18next";
import { useCategoryStyle } from "@/lib/use-category-style";
import { useNumberDisplay } from "@/lib/use-number-display";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { Money } from "@/components/shared/Money";
import { InsightTile } from "@/components/dashboard/InsightTile";
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
    <InsightTile
      icon={Icon}
      tone="bg-secondary/10 text-secondary"
      label={t("dashboard.topCategory.label")}
      value={<CategoryLabel category={top.name} type="expense" iconClassName="hidden" />}
      tooltip={t("dashboard.topCategory.tooltip")}
      trailing={
        <span className="bg-secondary/10 text-secondary shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          <Money>
            {formatN(top.spent)} {currencyLabel}
          </Money>
        </span>
      }
    />
  );
}
