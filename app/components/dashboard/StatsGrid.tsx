import {
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  PiggyBank,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DashboardStat } from "@/lib/demo-financials";

const ICONS = {
  balance: Wallet,
  income: TrendingUp,
  spending: ArrowLeftRight,
  savingsRate: PiggyBank,
} as const;

function formatValue(stat: DashboardStat, currency: string) {
  if (stat.key === "savingsRate") return `${stat.value}%`;
  return `${stat.value.toLocaleString()} ${currency}`;
}

function StatCard({ stat, currency }: { stat: DashboardStat; currency: string }) {
  const { t } = useTranslation();
  const Icon = ICONS[stat.key];
  const isUp = stat.deltaPct >= 0;
  const isGood = isUp ? stat.goodDirection === "up" : stat.goodDirection === "down";
  const DeltaIcon = isUp ? ArrowUp : ArrowDown;

  return (
    <div className="card border-base-300 bg-base-100 border shadow-sm">
      <div className="card-body gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Icon
              data-no-flip={stat.key === "spending" || undefined}
              className="size-4.5"
            />
          </span>
          <p className="text-base-content/60 text-sm">
            {t(`dashboard.stats.${stat.key}`)}
          </p>
        </div>
        <p className="text-2xl font-semibold tabular-nums">
          {formatValue(stat, currency)}
        </p>
        <div
          className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isGood ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
        >
          <DeltaIcon className="size-3.5" />
          <span>
            {Math.abs(stat.deltaPct)}% {t("dashboard.stats.vsLastMonth")}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatsGrid({
  currency,
  stats,
}: {
  currency: string;
  stats: DashboardStat[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.key} stat={stat} currency={currency} />
      ))}
    </div>
  );
}
