import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart3, Pencil } from "lucide-react";
import { BudgetMonthNav } from "@/components/budget/BudgetMonthNav";
import { BudgetInsights } from "@/components/budget/BudgetInsights";
import { BudgetKpiStrip } from "@/components/budget/BudgetKpiStrip";
import { BudgetProgressSection } from "@/components/budget/BudgetProgressSection";
import { BudgetTopTransactions } from "@/components/budget/BudgetTopTransactions";
import { SavingsPerMonthChart } from "@/components/budget/SavingsPerMonthChart";
import { BudgetHistorySection } from "@/components/budget/BudgetHistorySection";
import { AllocationsEditModal } from "@/components/dashboard/AllocationsEditModal";
import { PageBanner } from "@/components/shared/layout/PageBanner";
import { usePageTitle } from "@/lib/use-page-title";
import { currentPeriod } from "@/lib/budget-period";
import { useMonthlySummaries } from "@/queries/analytics";
import { useBudget } from "@/queries/budget";

export default function BudgetPage() {
  const { t } = useTranslation();
  usePageTitle(t("budget.title"));
  const [period, setPeriod] = useState(currentPeriod());
  const { data: budget } = useBudget();
  const editModalRef = useRef<HTMLDialogElement>(null);

  // No from/to -> every month that has at least one transaction (see
  // MonthlySummariesView's docstring: unbounded, naturally capped by the
  // user's own history). Unioned with the current calendar month so a
  // brand-new account with zero transactions yet still has one selectable,
  // navigable month instead of an all-disabled picker.
  const { data: summaries } = useMonthlySummaries();
  const availablePeriods = useMemo(() => {
    const months = new Set((summaries ?? []).map((s) => s.month.slice(0, 7)));
    months.add(currentPeriod());
    return [...months];
  }, [summaries]);

  // Measured, not CSS-only: a plain grid row's `auto` height is sized from
  // each item's max-content size, which is defined to ignore overflow — so
  // History's `overflow-y-auto` never actually shrinks its contribution to
  // the row, and min-h-0 alone doesn't fix that (it changes the automatic
  // *minimum*, not the max-content query the row-sizing pass uses). Only a
  // concrete pixel height gives its inner scroll area something definite to
  // clip against. lg:h-(--savings-card-height) below only takes effect at
  // the lg breakpoint, so mobile's stacked layout stays natural-height.
  //
  // useLayoutEffect + a synchronous getBoundingClientRect() read (not just
  // the ResizeObserver) — ResizeObserver's first callback is inherently
  // async (fires after paint), so relying on it alone left one render, on
  // every mount, where --savings-card-height was still unset. CSS treats
  // height: var(--unset-property) as an invalid declaration and falls back
  // to auto (full natural height) for that render — this is the "sometimes
  // shows full height" History was flashing before landing on the matched
  // height a moment later.
  const savingsRef = useRef<HTMLDivElement>(null);
  const [savingsHeight, setSavingsHeight] = useState<number>();
  useLayoutEffect(() => {
    const el = savingsRef.current;
    if (!el) return;
    setSavingsHeight(el.getBoundingClientRect().height);
    const observer = new ResizeObserver((entries) =>
      setSavingsHeight(entries[0].contentRect.height),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("budget.title")}
        subtitle={t("budget.subtitle")}
        icon={BarChart3}
        actions={
          budget &&
          budget.allocations.length > 0 && (
            <button
              type="button"
              onClick={() => editModalRef.current?.showModal()}
              className="btn btn-sm bg-primary-content/15 hover:bg-primary-content/25 text-primary-content gap-2 border-none"
            >
              <Pencil data-no-flip className="size-4" />
              {t("budget.editCta")}
            </button>
          )
        }
      />
      {budget && (
        <AllocationsEditModal ref={editModalRef} allocations={budget.allocations} />
      )}

      <div className="flex justify-end">
        <BudgetMonthNav
          period={period}
          onPeriodChange={setPeriod}
          availablePeriods={availablePeriods}
        />
      </div>

      <BudgetInsights period={period} />
      <BudgetKpiStrip period={period} />

      {/* One elevated shell for both widget rows — each widget used to carry
          its own border/shadow, which read as four stacked cards instead of
          one coherent "current standing" section; a shared card with thin
          border-t dividers between rows matches dashboard.tsx's convention. */}
      <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
        <div className="flex flex-col gap-6 py-4 md:py-6">
          <div className="divide-base-300/60 grid grid-cols-1 items-stretch gap-6 px-4 md:px-6 lg:grid-cols-3 lg:gap-0 lg:divide-x">
            <div className="min-w-0 lg:col-span-2 lg:pe-6">
              <BudgetProgressSection period={period} />
            </div>
            <div className="min-w-0 lg:ps-6">
              <BudgetTopTransactions period={period} />
            </div>
          </div>

          {/* Bleeds edge-to-edge across the card, not just the padded
              content column, so the line reads as one continuous seam. */}
          <div className="border-base-300/60 border-t" />

          <div className="divide-base-300/60 grid grid-cols-1 items-stretch gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-0 lg:divide-x">
            <div ref={savingsRef} className="lg:pe-6">
              <SavingsPerMonthChart />
            </div>
            <div
              // The 420px fallback (only used while --savings-card-height is
              // unset) is what actually makes this robust across client-side
              // route navigation, not just a fresh load: var()'s fallback only
              // applies when the custom property is missing/invalid, so even if
              // the measurement effect below runs late, races with this card's
              // own data loading, or (SSR/hydration edge cases) never fires at
              // all, this never silently falls through to `auto` (full natural
              // height) the way lg:h-(--savings-card-height) alone did.
              className="lg:h-(--savings-card-height,420px) lg:ps-6"
              style={
                savingsHeight
                  ? ({
                      "--savings-card-height": `${savingsHeight}px`,
                    } as React.CSSProperties)
                  : undefined
              }
            >
              <BudgetHistorySection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
