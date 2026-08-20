import { useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { DashboardFilters } from "@/types/dashboard";
import { dashboardPeriodRange } from "@/lib/dashboard-period";
import {
  ArrowLeftRight,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  Inbox,
  Plus,
} from "lucide-react";
import { useTransactions } from "@/queries/transactions";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import { useNumberDisplay } from "@/lib/use-number-display";

const RECENT_COUNT = 10;

const TYPE_CHIPS = ["all", "income", "expense"] as const;
type TypeChip = (typeof TYPE_CHIPS)[number];

function SummaryCard({
  to,
  tooltip,
  icon: Icon,
  color,
  title,
  count,
  countLabel,
  emptyIcon: EmptyIcon,
  emptyLabel,
  emptyCtaLabel,
  controls,
  children,
}: {
  to: string;
  tooltip: string;
  icon: typeof ArrowLeftRight;
  color: string;
  title: string;
  count: number;
  countLabel: string;
  emptyIcon: typeof ArrowLeftRight;
  emptyLabel: string;
  emptyCtaLabel: string;
  /** Inline filter controls rendered in the header row. They live inside the
   * card's Link, so they must preventDefault their own clicks. */
  controls?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isEmpty = count === 0;

  return (
    <Tooltip content={tooltip} className="h-full w-full">
      <Link
        to={to}
        // When empty, the whole card is the invitation to add the first item —
        // send it straight into the add flow instead of the (empty) list view.
        state={isEmpty ? { openAdd: true } : undefined}
        className="hover:bg-base-200/40 group animate-entry block h-full w-full rounded-xl transition-colors"
      >
        <div className="flex h-full min-h-0 flex-col gap-3 p-3">
          {/* Same icon + h2 shape every other dashboard card's header uses
              (see GoalCard/BudgetSplitCard/AnomaliesCard/RecurringChargesCard)
              — count and the chevron ride along as trailing content, same
              slot their pencil/edit buttons occupy elsewhere. */}
          <div className="flex shrink-0 items-center gap-1.5">
            <Icon className={`size-4 shrink-0 ${color}`} />
            <h2 className="line-clamp-1 flex-1 text-sm font-semibold">{title}</h2>
            {count > 0 && (
              <span className="text-base-content/50 shrink-0 text-xs">{countLabel}</span>
            )}
            <ChevronRight className="text-base-content/30 group-hover:text-primary size-4 shrink-0 transition-[color,translate] ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
          </div>
          {controls}
          {count > 0 ? (
            <div className="relative min-h-0 flex-1">
              <ul className="flex h-full flex-col gap-2 overflow-y-auto">{children}</ul>
              {/* Fade hints that the list keeps going below the fold — cheap CSS-only
                  affordance, harmless to render even when the list doesn't overflow. */}
              <div
                aria-hidden="true"
                className="from-base-100 pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-linear-to-t to-transparent"
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-1.5">
                <EmptyIcon className="text-base-content/30 size-4 shrink-0" />
                <p className="text-base-content/50 text-xs">{emptyLabel}</p>
              </div>
              {/* Purely visual — the card itself (the enclosing `<Link>`) is the
                  click target, so this isn't a real nested button. */}
              <span className="btn btn-primary btn-xs pointer-events-none gap-1 font-medium normal-case shadow-sm">
                <Plus className="size-3.5" />
                {emptyCtaLabel}
              </span>
            </div>
          )}
        </div>
      </Link>
    </Tooltip>
  );
}

function TransactionsSummary({ filters }: { filters: DashboardFilters }) {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const [typeChip, setTypeChip] = useState<TypeChip>("all");
  const range = dashboardPeriodRange(filters.period);
  const { data, isPending, isError, refetch } = useTransactions({
    limit: RECENT_COUNT,
    type: typeChip === "all" ? undefined : typeChip,
    accountId: filters.accountId,
    from: range.from,
    to: range.to,
  });
  const formatN = useNumberDisplay();

  if (isPending) {
    return <CardSkeleton bare icon={ArrowLeftRight} className="animate-entry h-full" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} className="animate-entry h-full" />;
  }

  return (
    <SummaryCard
      controls={
        <div className="flex shrink-0 gap-1">
          {TYPE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              aria-pressed={typeChip === chip}
              onClick={(e) => {
                // Inside the card's Link — keep the click from navigating.
                e.preventDefault();
                e.stopPropagation();
                setTypeChip(chip);
              }}
              className={`badge badge-sm cursor-pointer border transition-colors ${
                typeChip === chip
                  ? "badge-primary"
                  : "border-base-300 bg-base-200/50 text-base-content/60 hover:border-primary/40"
              }`}
            >
              {t(`common.filters.${chip}`)}
            </button>
          ))}
        </div>
      }
      to={`/${lang}/transactions`}
      tooltip={t("dashboard.recentActivity.transactionsTooltip")}
      icon={ArrowLeftRight}
      color="text-info"
      title={t("dashboard.recentActivity.transactionsTitle")}
      count={data?.total ?? 0}
      countLabel={t("transactions.pagination.total", { count: data?.total ?? 0 })}
      emptyIcon={Inbox}
      emptyLabel={t("transactions.emptyShort")}
      emptyCtaLabel={t("transactions.emptyCta")}
    >
      {data?.items.map((tx) => {
        const isIncome = tx.type === "income";
        const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;
        return (
          <li key={tx.id} className="flex items-center gap-2">
            <TypeIcon
              data-no-flip
              className={`size-4 shrink-0 ${isIncome ? "text-success" : "text-base-content/40"}`}
            />
            <span className="min-w-0 flex-1 truncate text-sm">{tx.title}</span>
            <Money
              className={`shrink-0 text-sm font-medium tabular-nums ${isIncome ? "text-success" : "text-base-content"}`}
            >
              <span dir="ltr">
                {isIncome ? "+" : "-"}
                {formatN(tx.amount)}
              </span>
            </Money>
          </li>
        );
      })}
    </SummaryCard>
  );
}

/** Links through to the full transactions page — was previously paired with
 * a Recent Statements card, dropped as lower-value (relevant mainly right
 * after an upload, not a daily glance) so Transactions gets the full slot
 * instead of splitting it with something people check less often. */
export function RecentActivityCard({ filters }: { filters: DashboardFilters }) {
  return (
    <div className="h-full">
      <TransactionsSummary filters={filters} />
    </div>
  );
}
