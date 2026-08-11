import { useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { BudgetCategory, DashboardPeriod } from "@/types/dashboard";
import { dashboardPeriodRange } from "@/lib/dashboard-period";
import { useCategoryStyle } from "@/lib/use-category-style";
import { useCategories, sortByValueFallbackLast } from "@/queries/categories";
import { useBudget } from "@/queries/budget";

/**
 * Derived view model for BudgetSplitCard: what to chart/list and in what
 * order, kept separate from how it's drawn.
 */
export function useBudgetSplitView({
  categories,
  period,
}: {
  categories: BudgetCategory[];
  period: DashboardPeriod;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { color } = useCategoryStyle();
  const { data: taxonomy } = useCategories();
  const { data: budget } = useBudget();
  const modalRef = useRef<HTMLDialogElement>(null);

  // Clicking a category (pie slice or budget row) opens the transactions page
  // pre-filtered to that category's spending over the dashboard's period.
  const drillDown = (category: string) =>
    navigate(`/${lang}/transactions`, {
      state: {
        txFilters: { type: "expense", category, ...dashboardPeriodRange(period) },
      },
    });

  const isFallbackCategory = (name: string) =>
    taxonomy?.find((c) => c.name === name)?.isFallback ?? false;
  const totalAllocated = categories.reduce((sum, c) => sum + c.budget, 0);

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
  // The taxonomy's fallback bucket (e.g. "other") always trails the rest
  // regardless of its allocation size — it's a catch-all, not a category the
  // user deliberately sized.
  const sortedCategories = sortByValueFallbackLast(
    categories.filter((c) => allocationValue(c) > 0),
    allocationValue,
    (c) => isFallbackCategory(c.name),
  );
  const pieSlices = sortedCategories.map((c) => ({
    name: c.name,
    displayName: t(`common.categories.${c.name}`, c.name),
    value: allocationValue(c),
  }));
  const pieTotal = pieSlices.reduce((sum, s) => sum + s.value, 0);

  return {
    budget,
    modalRef,
    drillDown,
    color,
    sortedCategories,
    pieSlices,
    pieTotal,
    totalAllocated,
  };
}
