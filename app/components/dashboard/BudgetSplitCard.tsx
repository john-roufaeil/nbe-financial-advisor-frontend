import { useRef } from "react";
import { PieChart, Pencil, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BudgetCategory } from "@/types/dashboard";
import { useCategoryColorVars } from "@/lib/category-colors";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { AllocationsEditModal } from "@/components/dashboard/AllocationsEditModal";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import { useBudget } from "@/queries/budget";

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
        <span className="font-medium">
          {t(`data.categories.${category.name}`, category.name)}
        </span>
        <Money className="text-base-content/60 tabular-nums">
          {category.spent.toLocaleString()} / {category.budget.toLocaleString()}{" "}
          {t(`currency.${currency}`, currency)}
        </Money>
      </div>
      <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full ${isOver ? "bg-error" : ""}`}
          style={{ width: `${pct}%`, backgroundColor: isOver ? undefined : color }}
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
  const colors = useCategoryColorVars();
  const totalAllocated = categories.reduce((sum, c) => sum + c.budget, 0);
  const modalRef = useRef<HTMLDialogElement>(null);
  const { data: budget } = useBudget();

  // Prefer each category's allocated *percentage* (from the same source the
  // edit-allocations modal writes to) so the chart always reads as a full,
  // colored split of the plan — not the dollar amounts, which are all zero
  // until a total budget exists even though the percentages are already set.
  // Only used when EVERY category has a match — mixing percentages (0-100
  // scale) with dollar amounts for just one mismatched category would throw
  // off that slice's proportion relative to the rest of the pie.
  const allocationPercentByCategory = new Map(
    (budget?.allocations ?? []).map((a) => [a.category, a.allocated_percentage]),
  );
  const useAllocationPercents =
    budget !== undefined &&
    categories.every((c) => allocationPercentByCategory.has(c.name));
  function allocationValue(c: BudgetCategory) {
    return useAllocationPercents ? allocationPercentByCategory.get(c.name)! : c.budget;
  }
  // Biggest allocation first, consistently across the pie, its legend, and
  // the spent/budget list below — all three read from this same order.
  // Categories with a 0% allocation carry no information in a split view, so
  // they're dropped entirely rather than rendered as an empty sliver/row.
  const sortedCategories = [...categories]
    .filter((c) => allocationValue(c) > 0)
    .sort((a, b) => allocationValue(b) - allocationValue(a));
  const pieSlices = sortedCategories.map((c) => ({
    name: t(`data.categories.${c.name}`, c.name),
    value: allocationValue(c),
  }));
  const pieTotal = pieSlices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="card border-base-300 bg-base-100 animate-entry h-full border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <PieChart className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">{t("dashboard.budget.title")}</h2>
          {budget && budget.allocations.length > 0 && (
            <Tooltip content={t("dashboard.budget.editAllocations")}>
              <button
                type="button"
                onClick={() => modalRef.current?.showModal()}
                className="btn btn-ghost btn-sm btn-square"
                aria-label={t("dashboard.budget.editAllocations")}
              >
                <Pencil data-no-flip className="size-4" />
              </button>
            </Tooltip>
          )}
        </div>
        {/* Defensive: a plan with zero allocations would otherwise render an
            empty donut, which reads as "your budget is all zeroes". */}
        {sortedCategories.length === 0 ? (
          <p className="text-base-content/50 py-6 text-center text-sm">
            {t("dashboard.budget.empty")}
          </p>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="flex w-full min-w-0 flex-col items-center gap-2 sm:w-auto">
              <CategoryDonutChart variant="pie" slices={pieSlices} />
              <p className="text-base-content/50 text-center text-xs">
                <Money className="text-base-content font-semibold">
                  {totalAllocated.toLocaleString()}
                </Money>{" "}
                {t(`currency.${currency}`, currency)} {t("dashboard.budget.allocated")}
              </p>
              <ul className="flex w-full min-w-0 flex-col gap-1.5">
                {sortedCategories.map((category, i) => {
                  const slicePct =
                    pieTotal > 0 ? Math.round((pieSlices[i].value / pieTotal) * 100) : 0;
                  return (
                    <li
                      key={category.name}
                      className="flex min-w-0 items-center gap-2 text-xs"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colors[i % colors.length] }}
                      />
                      <span className="text-base-content/70 min-w-0 truncate">
                        {t(`data.categories.${category.name}`, category.name)}
                      </span>
                      <span className="text-base-content/40 ms-auto shrink-0 tabular-nums">
                        {slicePct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <ul className="flex w-full min-w-0 flex-col gap-4">
              {sortedCategories.map((category, i) => (
                <BudgetRow
                  key={category.name}
                  category={category}
                  currency={currency}
                  color={colors[i % colors.length]}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
      {budget && <AllocationsEditModal ref={modalRef} allocations={budget.allocations} />}
    </div>
  );
}
