import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
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
import { GoalCard, GoalCardSkeleton } from "@/components/dashboard/GoalCard";
import { BudgetSplitCard } from "@/components/dashboard/BudgetSplitCard";
import { NoPlanCard } from "@/components/dashboard/NoPlanCard";
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
  const { data, isPending, isError, refetch } = useDashboard();

  return (
    <div className="mx-auto mb-16 flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6 xl:mb-0">
      <PageBanner
        title={t("nav.dashboard")}
        subtitle={t("dashboard.subtitle")}
        icon={LayoutDashboard}
        actions={
          <>
            <Link
              to={localizedPath(lang!, ROUTE_SEGMENTS.chat)}
              className="btn bg-secondary btn-sm text-secondary-content hover:bg-secondary/90 gap-2 border-none shadow-sm"
            >
              <Bot className="size-4" />
              {t("dashboard.askAdvisor")}
            </Link>
          </>
        }
      />

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <div className="flex flex-col gap-4">
          <StatsGrid currency={data.currency} stats={data.stats} />

          {/* Net worth and cash flow are real without a budget, so the stats
              stay. Goals, allocations and recent activity all share a single
              row so the whole dashboard fits without scrolling on laptops.
              A plan whose allocations are all zero (e.g. reset by the user)
              reads the same as no plan at all, so it gets the same empty
              state prompting a chat with the advisor. */}
          {data.hasPlan && data.budget.categories.some((c) => c.budget > 0) ? (
            <div className="grid items-stretch gap-4 md:grid-cols-3 xl:grid-cols-12">
              <div className="md:col-span-1 xl:col-span-3">
                <GoalCard currency={data.currency} />
              </div>
              <div className="md:col-span-2 xl:col-span-6">
                <BudgetSplitCard
                  categories={data.budget.categories}
                  currency={data.currency}
                />
              </div>
              <div className="md:col-span-3 xl:col-span-3 xl:self-start">
                <RecentActivityCard />
              </div>
            </div>
          ) : (
            <div className="grid items-stretch gap-4 md:grid-cols-3 xl:grid-cols-12">
              <div className="md:col-span-2 xl:col-span-9">
                <NoPlanCard />
              </div>
              <div className="md:col-span-1 xl:col-span-3 xl:self-start">
                <RecentActivityCard stacked />
              </div>
            </div>
          )}
        </div>
      )}

      <AddItemFab />
    </div>
  );
}
