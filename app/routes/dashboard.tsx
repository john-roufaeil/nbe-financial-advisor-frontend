import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import type { DashboardFilters } from "@/types/dashboard";
import { DashboardToolbar } from "@/components/dashboard/DashboardToolbar";
import { useDashboardPrefsStore } from "@/store/use-dashboard-prefs-store";
import {
  Bot,
  LayoutDashboard,
  PieChart,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  PiggyBank,
  ChartSpline,
} from "lucide-react";
import { PageBanner } from "@/components/shared/layout/PageBanner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { AnomaliesCard } from "@/components/dashboard/AnomaliesCard";
import { RecurringChargesCard } from "@/components/dashboard/RecurringChargesCard";
import { GoalCard, GoalCardSkeleton } from "@/components/dashboard/GoalCard";
import { BudgetSplitCard } from "@/components/dashboard/BudgetSplitCard";
import { NoPlanCard } from "@/components/dashboard/NoPlanCard";
import { IncomeStabilityCard } from "@/components/dashboard/IncomeStabilityCard";
import { RecurringTotalCard } from "@/components/dashboard/RecurringTotalCard";
import { TopCategoryCard } from "@/components/dashboard/TopCategoryCard";
import { AddItemFab } from "@/components/dashboard/AddItemFab";
import { InvestmentPlansSummaryCard } from "@/components/dashboard/InvestmentPlansSummaryCard";
import { useDashboard } from "@/queries/dashboard";
import { useRecurringCharges } from "@/queries/recurring-charges";
import { useAnomalies } from "@/queries/anomalies";
import { usePageTitle } from "@/lib/use-page-title";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";

/** Mirrors the real layout's current arrangement (headline stats, then
 * Goal+Insights, then Budget+Activity) so the loading state doesn't jump
 * around once data lands — kept in step with the JSX below by hand since
 * there's no single source of truth for "shape of the loaded layout" to
 * derive it from. */
function DashboardSkeleton() {
  return (
    <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
      <div className="divide-base-300/70 flex flex-col divide-y">
        <div className="divide-base-300/60 grid grid-cols-2 divide-x lg:grid-cols-4">
          <CardSkeleton bare icon={Wallet} className="p-3" />
          <CardSkeleton bare icon={TrendingUp} className="p-3" />
          <CardSkeleton bare icon={ArrowLeftRight} className="p-3" />
          <CardSkeleton bare icon={PiggyBank} className="p-3" />
        </div>
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <GoalCardSkeleton />
            </div>
            <div className="xl:col-span-1">
              <CardSkeleton bare icon={PiggyBank} fullHeight className="p-4" />
            </div>
          </div>
          <div className="border-base-300/60 border-t" />
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <CardSkeleton
                bare
                icon={PieChart}
                fullHeight
                donut
                className="p-4"
                rows={Array.from({ length: 4 }, () => ({ kind: "progress" as const }))}
              />
            </div>
            <div className="xl:col-span-1">
              <CardSkeleton bare icon={ArrowLeftRight} fullHeight className="p-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  usePageTitle(t("nav.dashboard"));
  const [filters, setFilters] = useState<DashboardFilters>({ period: "thisMonth" });
  const hiddenCards = useDashboardPrefsStore((s) => s.hiddenCards);
  const show = (card: (typeof hiddenCards)[number]) => !hiddenCards.includes(card);
  const { data, isPending, isError, refetch } = useDashboard(filters);
  const hasBudget =
    !isPending &&
    !isError &&
    data.hasPlan &&
    data.budget.categories.some((c) => c.budget > 0);
  // Same cache keys each card already queries — free, not duplicate
  // requests. Needed here so a row can skip rendering entirely (rather than
  // showing empty, padded, dividers) when the card inside it would
  // otherwise render nothing.
  const { data: recurringCharges } = useRecurringCharges();
  const { data: anomalies } = useAnomalies({ resolved: false });
  const hasAnomalies = (anomalies?.length ?? 0) > 0;
  const hasRecurringCharges = (recurringCharges?.length ?? 0) > 0;
  const hasInsights =
    !isPending &&
    !isError &&
    (!!data.stability ||
      hasRecurringCharges ||
      data.budget.categories.some((c) => c.spent > 0));

  return (
    <div className="mx-auto mb-16 flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("nav.dashboard")}
        subtitle={t(`dashboard.subtitlePeriods.${filters.period}`)}
        icon={LayoutDashboard}
        actions={
          <Link
            to={localizedPath(lang!, ROUTE_SEGMENTS.chat)}
            className="btn bg-secondary btn-sm text-secondary-content hover:bg-secondary/90 gap-2 border-none shadow-sm"
          >
            <Bot className="size-4" />
            {t("dashboard.askAdvisor")}
          </Link>
        }
      />

      <DashboardToolbar filters={filters} onFiltersChange={setFilters} />

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
          <div className="divide-base-300/70 flex flex-col divide-y">
            {/* Tier 1: the headline numbers — what a first-time viewer reads
                first. A quiet uppercase label names the tier so it's clear
                at a glance what these tiles are, without a card of its own. */}
            {show("stats") && (
              <div className="flex flex-col gap-3">
                <div className="divide-base-300/60 grid grid-cols-2 divide-x lg:grid-cols-4">
                  <StatsGrid
                    currency={data.currency}
                    stats={data.stats}
                    filters={filters}
                  />
                </div>
              </div>
            )}

            {/* Tier 2: "your plan" — goal progress and budget breakdown
                grouped together since they answer the same question (am I
                on track), followed by recent activity as the detail layer.
                Right after the headline numbers since this is the content
                people actually come here for — not buried under secondary
                context/alerts. */}
            <div className="flex flex-col gap-3 p-4 md:p-6">
              <div className="flex flex-col gap-6">
                {/* Goal pairs with Quick Insights instead of sitting alone —
                    both are compact/horizontal, so together they fill the
                    row that Goal's short content left half-empty on its own,
                    instead of wasting the other half or forcing Goal back
                    into a tall grid row with Budget (which reintroduces the
                    dead-space-under-Goal problem items-start alone doesn't
                    fix — see GoalCard.tsx). */}
                {(show("goal") || (show("insights") && hasInsights)) && (
                  <div className="grid gap-6 xl:grid-cols-3">
                    {show("goal") && (
                      <div
                        className={
                          show("insights") && hasInsights
                            ? "xl:col-span-2"
                            : "xl:col-span-3"
                        }
                      >
                        <GoalCard currency={data.currency} />
                      </div>
                    )}
                    {show("insights") && hasInsights && (
                      <div className="flex min-w-0 flex-col gap-3 xl:col-span-1">
                        {/* px-3 matches InsightTile's own p-3 below, so the
                            header's icon/text lines up with the tiles'
                            instead of sitting flush against the edge they're
                            inset from. */}
                        <div className="flex shrink-0 items-center gap-1.5 px-3">
                          <ChartSpline className="text-primary size-4 shrink-0" />
                          <h2 className="line-clamp-1 flex-1 text-sm font-semibold">
                            {t("dashboard.sections.quickInsights")}
                          </h2>
                        </div>
                        <div className="divide-base-300/60 flex flex-col divide-y">
                          {data.stability && (
                            <IncomeStabilityCard stability={data.stability} />
                          )}
                          <RecurringTotalCard currency={data.currency} />
                          <TopCategoryCard
                            categories={data.budget.categories}
                            currency={data.currency}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {(show("goal") || (show("insights") && hasInsights)) && (
                  <div className="border-base-300/60 border-t" />
                )}
                <div className="grid gap-6 xl:grid-cols-3">
                  {hasBudget ? (
                    show("budget") && (
                      <div className="min-w-0 xl:col-span-2">
                        <BudgetSplitCard
                          categories={data.budget.categories}
                          currency={data.currency}
                          period={filters.period}
                        />
                      </div>
                    )
                  ) : (
                    <div className="min-w-0 xl:col-span-2">
                      <NoPlanCard />
                    </div>
                  )}
                  {show("activity") && (
                    <div className="xl:col-span-1">
                      <RecentActivityCard filters={filters} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {show("investmentPlans") && <InvestmentPlansSummaryCard />}

            {/* Tier 3: anything needing attention. */}
            {show("anomalies") && hasAnomalies && (
              <div className="p-4 md:p-6">
                <AnomaliesCard />
              </div>
            )}

            {show("recurringCharges") && hasRecurringCharges && (
              <div className="p-4 md:p-6">
                <RecurringChargesCard currency={data.currency} />
              </div>
            )}
          </div>
        </div>
      )}

      <AddItemFab />
    </div>
  );
}
