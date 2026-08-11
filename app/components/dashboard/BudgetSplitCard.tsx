import type { BudgetCategory, DashboardPeriod } from "@/types/dashboard";
import { PieChart, Pencil, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { categoryIcon } from "@/lib/constants/category-icons";
import { CategoryDonutChart } from "@/components/dashboard/CategoryDonutChart";
import { AllocationsEditModal } from "@/components/dashboard/AllocationsEditModal";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useBudgetSplitView } from "@/lib/use-budget-split-view";

function BudgetRow({
  category,
  currency,
  color,
  onDrillDown,
}: {
  category: BudgetCategory;
  currency: string;
  color: string;
  onDrillDown: () => void;
}) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const pct = Math.min(100, Math.round((category.spent / category.budget) * 100));
  const isOver = category.spent > category.budget;
  const Icon = categoryIcon(category.name);

  return (
    <li
      role="button"
      tabIndex={0}
      aria-label={t("dashboard.budget.drillDown", {
        category: t(`common.categories.${category.name}`, category.name),
      })}
      onClick={onDrillDown}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onDrillDown();
        }
      }}
      className="hover:bg-base-200/60 focus-visible:outline-primary -mx-1.5 flex cursor-pointer flex-col gap-1.5 rounded-lg px-1.5 py-1 transition-colors"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="flex min-w-0 items-center gap-1.5 font-medium">
          <Icon data-no-flip className="text-base-content/60 size-3.5 shrink-0" />
          {t(`common.categories.${category.name}`, category.name)}
        </span>
        <Money className="text-base-content/60 tabular-nums">
          {formatN(category.spent)} / {formatN(category.budget)}{" "}
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
  period,
}: {
  currency: string;
  categories: BudgetCategory[];
  period: DashboardPeriod;
}) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const {
    budget,
    modalRef,
    drillDown,
    color,
    sortedCategories,
    pieSlices,
    pieTotal,
    totalAllocated,
  } = useBudgetSplitView({ categories, period });

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
              <CategoryDonutChart
                variant="pie"
                slices={pieSlices}
                onSelectName={drillDown}
              />
              <p className="text-base-content/50 text-center text-xs">
                <Money className="text-base-content font-semibold">
                  {formatN(totalAllocated)}
                </Money>{" "}
                {t(`currency.${currency}`, currency)} {t("dashboard.budget.allocated")}
              </p>
              <ul className="flex w-full min-w-0 flex-col gap-1.5">
                {sortedCategories.map((category, i) => {
                  const slicePct =
                    pieTotal > 0 ? Math.round((pieSlices[i].value / pieTotal) * 100) : 0;
                  const Icon = categoryIcon(category.name);
                  return (
                    <li
                      key={category.name}
                      className="flex min-w-0 items-center gap-2 text-xs"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color(category.name) }}
                      />
                      <Icon
                        data-no-flip
                        className="text-base-content/50 size-3.5 shrink-0"
                      />
                      <span className="text-base-content/40 ms-auto shrink-0 tabular-nums">
                        {slicePct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <ul className="flex w-full min-w-0 flex-col gap-4">
              {sortedCategories.map((category) => (
                <BudgetRow
                  key={category.name}
                  category={category}
                  currency={currency}
                  color={color(category.name)}
                  onDrillDown={() => drillDown(category.name)}
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
