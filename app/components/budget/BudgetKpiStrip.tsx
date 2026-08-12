import { useTranslation } from "react-i18next";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { useMonthlySummaries } from "@/queries/analytics";
import { HighlightStatCard } from "@/components/chat/tools/HighlightStatCard";
import { Money } from "@/components/shared/Money";
import { formatMoney } from "@/lib/format";

/** The selected period's headline numbers — shares `period` with the rest of
 * the "current standing" group (see BudgetInsights' docstring). */
export function BudgetKpiStrip({ period }: { period: string }) {
  const { t } = useTranslation();
  const { data: summaries, isPending } = useMonthlySummaries(period, period);
  const summary = summaries?.[0];
  const net = summary ? summary.totalInflow - summary.totalSpend : 0;

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-base-200 h-20 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <HighlightStatCard
        icon={ArrowUpCircle}
        label={t("budget.kpi.income")}
        colorClass="bg-success text-success-content"
        className="animate-entry"
        value={<Money>{formatMoney(summary?.totalInflow ?? 0)}</Money>}
      />
      <HighlightStatCard
        icon={ArrowDownCircle}
        label={t("budget.kpi.spend")}
        colorClass="bg-error text-error-content"
        className="animate-entry"
        value={<Money>{formatMoney(summary?.totalSpend ?? 0)}</Money>}
      />
      <HighlightStatCard
        icon={Wallet}
        label={t("budget.kpi.net")}
        colorClass={
          net >= 0 ? "bg-primary text-primary-content" : "bg-warning text-warning-content"
        }
        className="animate-entry"
        value={<Money>{formatMoney(net)}</Money>}
      />
    </div>
  );
}
