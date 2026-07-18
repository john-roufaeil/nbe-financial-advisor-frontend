import {
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  PiggyBank,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { DashboardFilters, DashboardStat } from "@/types/dashboard";
import { dashboardPeriodRange } from "@/lib/dashboard-period";
import { Money } from "@/components/shared/Money";
import { useNumberDisplay } from "@/lib/use-number-display";

const ICONS = {
  balance: Wallet,
  income: TrendingUp,
  spending: ArrowLeftRight,
  savingsRate: PiggyBank,
} as const;

/** The transactions-page type filter each stat drills into. Balance and
 * savings rate are derived numbers with no single transaction list behind
 * them, so they stay plain cards. */
const DRILL_TYPE = {
  income: "income",
  spending: "expense",
} as const;

function StatCard({
  stat,
  currency,
  filters,
}: {
  stat: DashboardStat;
  currency: string;
  filters: DashboardFilters;
}) {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
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

  const body = (
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
        <p className="text-base-content/60 text-sm">{t(`dashboard.stats.${stat.key}`)}</p>
      </div>
      <p className="text-2xl font-semibold tabular-nums">
        {stat.key === "savingsRate" ? formattedValue : <Money>{formattedValue}</Money>}
      </p>
      <div
        className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${trendClass}`}
      >
        <DeltaIcon className="size-3.5" />
        <span>
          {Math.abs(stat.deltaPct)}%{" "}
          {t(
            filters.period === "thisMonth"
              ? "dashboard.stats.vsLastMonth"
              : "dashboard.stats.vsPreviousPeriod",
          )}
        </span>
      </div>
    </div>
  );

  const drillType =
    stat.key === "income" || stat.key === "spending" ? DRILL_TYPE[stat.key] : undefined;

  if (!drillType) {
    return (
      <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
        {body}
      </div>
    );
  }

  return (
    <Link
      to={`/${lang}/transactions`}
      state={{ txFilters: { type: drillType, ...dashboardPeriodRange(filters.period) } }}
      aria-label={t("dashboard.stats.drillDown", {
        stat: t(`dashboard.stats.${stat.key}`),
      })}
      className="card border-base-300 bg-base-100 animate-entry hover:border-primary border shadow-sm transition-colors"
    >
      {body}
    </Link>
  );
}

export function StatsGrid({
  currency,
  stats = [],
  filters,
}: {
  currency: string;
  stats?: DashboardStat[];
  filters: DashboardFilters;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.key} stat={stat} currency={currency} filters={filters} />
      ))}
    </div>
  );
}
