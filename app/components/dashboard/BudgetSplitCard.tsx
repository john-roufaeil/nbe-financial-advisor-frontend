import { PieChart, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BudgetCategory } from "@/types/dashboard";
import { CATEGORY_BAR_COLORS } from "@/lib/category-colors";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { Money } from "@/components/shared/Money";

function BudgetRow({
  category,
  currency,
  color,
}: {
  category: BudgetCategory;
  currency: string;
  color: string;
}) {
  const { t } = useTranslation();
  const pct = Math.min(100, Math.round((category.spent / category.budget) * 100));
  const isOver = category.spent > category.budget;

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{category.name}</span>
        <Money className="text-base-content/60 tabular-nums">
          {category.spent.toLocaleString()} / {category.budget.toLocaleString()}{" "}
          {t(`currency.${currency}`, currency)}
        </Money>
      </div>
      <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${isOver ? "bg-error" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isOver && (
        <p className="text-error flex items-center gap-1 text-xs">
          <TriangleAlert className="size-3.5" />
          {t("dashboard.budget.over")}
        </p>
      )}
    </li>
  );
}

export function BudgetSplitCard({
  currency,
  categories,
}: {
  currency: string;
  categories: BudgetCategory[];
}) {
  const { t } = useTranslation();
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="card border-base-300 bg-base-100 animate-entry h-full border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <PieChart className="size-4.5" />
          </span>
          <h2 className="card-title text-base">{t("dashboard.budget.title")}</h2>
        </div>
        {/* Defensive: a plan with zero allocations would otherwise render an
            empty donut, which reads as "your budget is all zeroes". */}
        {categories.length === 0 ? (
          <p className="text-base-content/50 py-6 text-center text-sm">
            {t("dashboard.budget.empty")}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <CategoryDonutChart
              slices={categories.map((c) => ({ name: c.name, value: c.spent }))}
              centerValue={totalSpent.toLocaleString()}
              centerLabel={`${t(`currency.${currency}`, currency)} ${t("dashboard.budget.spent")}`}
            />
            <ul className="flex w-full min-w-0 flex-col gap-4">
              {categories.map((category, i) => (
                <BudgetRow
                  key={category.name}
                  category={category}
                  currency={currency}
                  color={CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
