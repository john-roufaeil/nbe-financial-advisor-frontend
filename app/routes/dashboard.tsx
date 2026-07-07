import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router";
import { MessageCircle } from "lucide-react";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { GoalsCard } from "@/components/dashboard/GoalsCard";
import { BudgetSplitCard } from "@/components/dashboard/BudgetSplitCard";
import { getDashboardStats, getBudgetPlan } from "@/lib/demo-financials";
import { usePageTitle } from "@/lib/use-page-title";

export default function Dashboard() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  usePageTitle(t("nav.dashboard"));
  const { currency, stats } = getDashboardStats();
  const budget = getBudgetPlan();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t("nav.dashboard")}</h1>
          <p className="text-base-content/60 text-sm">{t("dashboard.subtitle")}</p>
        </div>
        <Link to={`/${lang}/chat`} className="btn btn-secondary gap-2 shadow-sm">
          <MessageCircle className="size-4" />
          {t("dashboard.askAdvisor")}
        </Link>
      </div>

      <StatsGrid currency={currency} stats={stats} />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <GoalsCard currency={currency} />
        </div>
        <div className="lg:col-span-3">
          <BudgetSplitCard categories={budget.categories} currency={budget.currency} />
        </div>
      </div>
    </div>
  );
}
