import {
  Wallet,
  TrendingUp,
  ArrowLeftRight,
  PiggyBank,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { DashboardFilters, DashboardStat } from "@/types/dashboard";
import { dashboardPeriodRange } from "@/lib/dashboard-period";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
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

  const drillType =
    stat.key === "income" || stat.key === "spending" ? DRILL_TYPE[stat.key] : undefined;

  const body = (
    <div className="flex w-full flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-lg ${trendClass}`}
        >
          <Icon
            data-no-flip={stat.key === "spending" || undefined}
            className="size-4.5"
          />
        </span>
        <p className="text-base-content/60 flex-1 text-sm">
          {t(`dashboard.stats.${stat.key}`)}
        </p>
        {drillType && (
          <ChevronRight className="text-base-content/30 group-hover:text-primary size-4 shrink-0 transition-[color,translate] ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
        )}
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

  if (!drillType) {
    return (
      <Tooltip
        content={t(`dashboard.stats.tooltips.${stat.key}`)}
        className="h-full w-full"
      >
        {body}
      </Tooltip>
    );
  }

  return (
    <Link
      to={`/${lang}/transactions`}
      state={{ txFilters: { type: drillType, ...dashboardPeriodRange(filters.period) } }}
      aria-label={t("dashboard.stats.drillDown", {
        stat: t(`dashboard.stats.${stat.key}`),
      })}
      className="hover:bg-base-200/50 group block transition-colors"
    >
      <Tooltip
        content={t(`dashboard.stats.tooltips.${stat.key}`)}
        className="h-full w-full"
      >
        {body}
      </Tooltip>
    </Link>
  );
}

/**
 * Renders bare — no grid/wrapper of its own — so its stat tiles join the
 * dashboard's single "at a glance" hairline-divided grid alongside the
 * smaller insight tiles (dashboard.tsx composes the actual grid).
 */
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
    <>
      {stats.map((stat) => (
        <StatCard key={stat.key} stat={stat} currency={currency} filters={filters} />
      ))}
    </>
  );
}
