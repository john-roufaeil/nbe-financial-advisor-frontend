import {
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  PiggyBank,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DashboardStat } from "@/types/dashboard";
import { Money } from "@/components/shared/Money";
import { useNumberDisplay } from "@/lib/use-number-display";

const ICONS = {
  balance: Wallet,
  income: TrendingUp,
  spending: ArrowLeftRight,
  savingsRate: PiggyBank,
} as const;

function StatCard({ stat, currency }: { stat: DashboardStat; currency: string }) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const formattedValue =
    stat.key === "savingsRate"
      ? `${stat.value}%`
      : `${formatN(stat.value)} ${t(`currency.${currency}`, currency)}`;
  const Icon = ICONS[stat.key];
  const isFlat = stat.deltaPct === 0;
  const isUp = stat.deltaPct >= 0;
  const isGood = isUp ? stat.goodDirection === "up" : stat.goodDirection === "down";
  const DeltaIcon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;
  const trendClass = isFlat
    ? "bg-base-200 text-base-content/50"
    : isGood
      ? "bg-success/10 text-success"
      : "bg-error/10 text-error";

  return (
    <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
      <div className="card-body gap-3 p-4">
        <div className="flex items-center gap-2">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ${trendClass}`}
          >
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
          {stat.key === "savingsRate" ? formattedValue : <Money>{formattedValue}</Money>}
        </p>
        <div
          className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendClass}`}
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
  stats = [],
}: {
  currency: string;
  stats?: DashboardStat[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.key} stat={stat} currency={currency} />
      ))}
    </div>
  );
}
