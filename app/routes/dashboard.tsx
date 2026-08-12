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
  FileText,
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
import { AccountsSummaryCard } from "@/components/dashboard/AccountsSummaryCard";
import { RecurringTotalCard } from "@/components/dashboard/RecurringTotalCard";
import { TopCategoryCard } from "@/components/dashboard/TopCategoryCard";
import { DaysToGoalCard } from "@/components/dashboard/DaysToGoalCard";
import { AddItemFab } from "@/components/dashboard/AddItemFab";
import { useDashboard } from "@/queries/dashboard";
import { usePageTitle } from "@/lib/use-page-title";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";

function DashboardSkeleton() {
  return (
    <div className="animate-entry flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton icon={Wallet} />
        <CardSkeleton icon={TrendingUp} />
        <CardSkeleton icon={ArrowLeftRight} />
        <CardSkeleton icon={PiggyBank} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <GoalCardSkeleton />
        </div>
        <div className="xl:col-span-6">
          <CardSkeleton
            icon={PieChart}
            fullHeight
            donut
            rows={Array.from({ length: 4 }, () => ({ kind: "progress" as const }))}
          />
        </div>
        <div className="flex flex-col gap-4 md:col-span-2 xl:col-span-3">
          <CardSkeleton icon={ArrowLeftRight} />
          <CardSkeleton icon={FileText} />
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

  return (
    <div className="mx-auto mb-16 flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("nav.dashboard")}
        subtitle={t("dashboard.subtitle")}
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

      {!isPending && !isError && show("insights") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data.stability && <IncomeStabilityCard stability={data.stability} />}
          <AccountsSummaryCard />
          <RecurringTotalCard currency={data.currency} />
          <TopCategoryCard categories={data.budget.categories} currency={data.currency} />
          <DaysToGoalCard />
        </div>
      )}

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-4">
          {show("stats") && (
            <StatsGrid currency={data.currency} stats={data.stats} filters={filters} />
          )}

          {/* Net worth and cash flow are real without a budget, so the stats
              stay. Goals, allocations and recent activity all share a single
              row so the whole dashboard fits without scrolling on laptops.
              A plan whose allocations are all zero (e.g. reset by the user)
              reads the same as no plan at all, so it gets the same empty
              state prompting a chat with the advisor.
              Each card can be hidden from the Customize menu.
              At xl+ this row joins a single 4-column grid shared with the
              stats above it (goal/activity = 1 column each, budget = 2) so
              every "unit" card is the same width; below xl everything just
              stacks in the outer flex column. */}
          {data.hasPlan && data.budget.categories.some((c) => c.budget > 0) ? (
            <>
              {show("goal") && (
                <div className="xl:col-start-1 xl:row-start-2">
                  <GoalCard currency={data.currency} />
                </div>
              )}
              {show("budget") && (
                <div className="min-w-0 xl:col-span-2 xl:col-start-2 xl:row-start-2">
                  <BudgetSplitCard
                    categories={data.budget.categories}
                    currency={data.currency}
                    period={filters.period}
                  />
                </div>
              )}
              {show("activity") && (
                <div className="xl:col-start-4 xl:row-start-2">
                  <RecentActivityCard filters={filters} />
                </div>
              )}
            </>
          ) : (
            <>
              {show("goal") && (
                <div className="xl:col-start-1 xl:row-start-2">
                  <GoalCard currency={data.currency} />
                </div>
              )}
              <div className="min-w-0 xl:col-span-2 xl:col-start-2 xl:row-start-2">
                <NoPlanCard />
              </div>
              {show("activity") && (
                <div className="xl:col-start-4 xl:row-start-2">
                  <RecentActivityCard stacked filters={filters} />
                </div>
              )}
            </>
          )}

          {show("anomalies") && (
            <div className="xl:col-span-4 xl:row-start-3">
              <AnomaliesCard />
            </div>
          )}

          {show("recurringCharges") && (
            <div className="xl:col-span-4 xl:row-start-4">
              <RecurringChargesCard currency={data.currency} />
            </div>
          )}
        </div>
      )}

      <AddItemFab />
    </div>
  );
}
