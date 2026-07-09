import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import { Bot, Database, Cloud, Sparkles } from "lucide-react";
import { BalanceVisibilityToggle } from "@/components/shared/BalanceVisibilityToggle";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { BudgetSplitCard } from "@/components/dashboard/BudgetSplitCard";
import { AddItemFab } from "@/components/dashboard/AddItemFab";
import { useDashboard } from "@/queries/dashboard";
import { useDataSourceStore } from "@/store/use-data-source-store";
import { usePageTitle } from "@/lib/use-page-title";
import { CardSkeleton, ErrorState } from "@/components/shared/QueryState";

function DataSourceToggle() {
  const { t } = useTranslation();
  const source = useDataSourceStore((s) => s.source);
  const setSource = useDataSourceStore((s) => s.setSource);

  return (
    <div className="join border-base-300 bg-base-200 w-fit rounded-lg border">
      <button
        type="button"
        onClick={() => setSource("mock")}
        className={`btn btn-sm join-item cursor-pointer gap-1.5 ${source === "mock" ? "btn-accent" : "btn-ghost"}`}
      >
        <Database className="size-3.5" />
        {t("dashboard.dataSource.mock")}
      </button>
      <button
        type="button"
        onClick={() => setSource("backend")}
        className={`btn btn-sm join-item cursor-pointer gap-1.5 ${source === "backend" ? "btn-accent" : "btn-ghost"}`}
      >
        <Cloud className="size-3.5" />
        {t("dashboard.dataSource.backend")}
      </button>
    </div>
  );
}

function GoalsCardSkeleton() {
  return (
    <div
      className="card border-base-300 bg-base-100 h-full border shadow-sm"
      aria-hidden="true"
    >
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="bg-base-200 size-9 shrink-0 animate-pulse rounded-lg" />
          <div className="bg-base-200 h-4 w-1/3 animate-pulse rounded" />
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="bg-base-200 h-3.5 w-1/4 animate-pulse rounded" />
                <div className="bg-base-200 h-3.5 w-1/3 animate-pulse rounded" />
              </div>
              <div className="bg-base-200 h-2 w-full animate-pulse rounded-full" />
              <div className="bg-base-200 h-3 w-2/5 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BudgetCardSkeleton() {
  return (
    <div
      className="card border-base-300 bg-base-100 h-full border shadow-sm"
      aria-hidden="true"
    >
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="bg-base-200 size-9 shrink-0 animate-pulse rounded-lg" />
          <div className="bg-base-200 h-4 w-1/3 animate-pulse rounded" />
        </div>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="bg-base-200 size-24 shrink-0 animate-pulse rounded-full" />
          <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="bg-base-200 h-3.5 w-1/4 animate-pulse rounded" />
                  <div className="bg-base-200 h-3.5 w-1/3 animate-pulse rounded" />
                </div>
                <div className="bg-base-200 h-2 w-full animate-pulse rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-entry flex flex-col gap-6">
      <CardSkeleton />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <GoalsCardSkeleton />
        </div>
        <div className="lg:col-span-3">
          <BudgetCardSkeleton />
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
      <div className="from-primary to-primary/80 text-primary-content animate-entry relative overflow-hidden rounded-2xl bg-linear-to-br p-5 shadow-sm">
        <Sparkles className="absolute -inset-e-4 -top-4 size-28 opacity-10" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{t("nav.dashboard")}</h1>
            <p className="mt-0.5 text-sm opacity-80">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <BalanceVisibilityToggle />
            <DataSourceToggle />
            <Link
              to={`/${lang}/chat`}
              className="btn bg-secondary btn-sm text-secondary-content hover:bg-secondary/90 gap-2 border-none shadow-sm"
            >
              <Bot className="size-4" />
              {t("dashboard.askAdvisor")}
            </Link>
          </div>
        </div>
      </div>

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <div className="animate-entry">
            <StatsGrid currency={data.currency} stats={data.stats} />
          </div>

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
        </>
      )}

      <AddItemFab />
    </div>
  );
}
