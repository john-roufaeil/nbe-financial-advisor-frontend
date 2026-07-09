import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import {
  Bot,
  LayoutDashboard,
  Target,
  PieChart,
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  PiggyBank,
} from "lucide-react";
import { PageBanner } from "@/components/shared/PageBanner";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { BudgetSplitCard } from "@/components/dashboard/BudgetSplitCard";
import { NoPlanCard } from "@/components/dashboard/NoPlanCard";
import { AddItemFab } from "@/components/dashboard/AddItemFab";
import { useDashboard } from "@/queries/dashboard";
import { usePageTitle } from "@/lib/use-page-title";
import { CardSkeleton, ErrorState } from "@/components/shared/QueryState";

function DashboardSkeleton() {
  return (
    <div className="animate-entry flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton icon={Wallet} />
        <CardSkeleton icon={TrendingUp} />
        <CardSkeleton icon={ArrowLeftRight} />
        <CardSkeleton icon={PiggyBank} />
      </div>{" "}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <CardSkeleton
            icon={Target}
            fullHeight
            rows={[
              { kind: "progress", trailingText: true },
              { kind: "progress", trailingText: true },
              { kind: "progress", trailingText: true },
            ]}
          />
        </div>
        <div className="lg:col-span-3">
          <CardSkeleton
            icon={PieChart}
            fullHeight
            donut
            rows={Array.from({ length: 5 }, () => ({ kind: "progress" as const }))}
          />
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <PageBanner
        title={t("nav.dashboard")}
        subtitle={t("dashboard.subtitle")}
        icon={LayoutDashboard}
        actions={
          <>
            <Link
              to={`/${lang}/chat`}
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
        <>
          <div className="animate-entry">
            <StatsGrid currency={data.currency} stats={data.stats} />
          </div>

          {/* Net worth and cash flow are real without a budget, so the stats
              stay. Goals and allocations only exist inside a plan. */}
          {data.hasPlan ? (
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="animate-entry lg:col-span-2">
                <GoalsCard currency={data.currency} />
              </div>
              <div className="animate-entry lg:col-span-3">
                <BudgetSplitCard
                  categories={data.budget.categories}
                  currency={data.currency}
                />
              </div>
            </div>
          ) : (
            <div className="animate-entry">
              <NoPlanCard />
            </div>
          )}
        </>
      )}

      <AddItemFab />
    </div>
  );
}
