import { useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { DashboardFilters } from "@/types/dashboard";
import { dashboardPeriodRange } from "@/lib/dashboard-period";
import {
  ArrowLeftRight,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  Inbox,
  FileX2,
  Plus,
} from "lucide-react";
import { useTransactions } from "@/queries/transactions";
import { useBankStatements } from "@/queries/bank-statements";
import { BankBadge } from "@/components/shared/BankBadge";
import { Money } from "@/components/shared/Money";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { ErrorState } from "@/components/shared/QueryState";
import { formatDate } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";

const RECENT_COUNT = 2;

const TYPE_CHIPS = ["all", "income", "expense"] as const;
type TypeChip = (typeof TYPE_CHIPS)[number];

function SummaryCard({
  to,
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
    <Link
      to={to}
      // When empty, the whole card is the invitation to add the first item —
      // send it straight into the add flow instead of the (empty) list view.
      state={isEmpty ? { openAdd: true } : undefined}
      className="card border-base-300 bg-base-100 hover:border-primary group animate-entry h-48 border shadow-sm transition-colors xl:h-full"
    >
      <div className="card-body flex h-full min-h-0 flex-col gap-3 p-4">
        <div className="flex shrink-0 items-center gap-2">
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${color}`}>
            <Icon className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base-content text-sm font-semibold">{title}</h3>
            {count > 0 && <p className="text-base-content/50 text-xs">{countLabel}</p>}
          </div>
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

  if (isPending) return <CardSkeleton icon={ArrowLeftRight} className="animate-entry" />;

  if (isError) {
    return (
      <ErrorState onRetry={() => refetch()} className="animate-entry h-48 xl:h-full" />
    );
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
      icon={ArrowLeftRight}
      color="bg-info/10 text-info"
      title={t("transactions.title")}
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

function BankStatementsSummary() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const { data, isPending, isError, refetch } = useBankStatements({
    limit: RECENT_COUNT,
  });
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);

  if (isPending) return <CardSkeleton icon={FileText} className="animate-entry" />;

  if (isError) {
    return (
      <ErrorState onRetry={() => refetch()} className="animate-entry h-48 xl:h-full" />
    );
  }

  return (
    <SummaryCard
      to={`/${lang}/bank-statements`}
      icon={FileText}
      color="bg-secondary/10 text-secondary"
      title={t("bankStatements.title")}
      count={data?.total ?? 0}
      countLabel={t("bankStatements.pagination.total", { count: data?.total ?? 0 })}
      emptyIcon={FileX2}
      emptyLabel={t("bankStatements.emptyShort")}
      emptyCtaLabel={t("bankStatements.emptyCta")}
    >
      {data?.items.map((doc) => (
        <li key={doc.id}>
          <BankBadge
            bank={doc.bankName}
            size="size-6"
            subtitle={formatDate(doc.uploadDate, dateFormat)}
          />
        </li>
      ))}
    </SummaryCard>
  );
}

/**
 * Dashboard-level summaries linking through to the full transactions/bank statements
 * pages. This column sits full-width on narrower laptops (before the goal/budget
 * row splits into a tight 12-col grid) so a container query — not a viewport
 * one — lets the two cards sit side by side whenever they actually have the
 * room, and stack once the column itself gets squeezed back to sidebar width.
 * Deliberately not stretched to the row's full height: on the wide, single-column
 * layout the two cards sit flush at the top and leave the rest of the column
 * clear for the floating add button instead of stretching to match it.
 */
export function RecentActivityCard({
  stacked = false,
  filters,
}: {
  stacked?: boolean;
  filters: DashboardFilters;
}) {
  return (
    <div className="@container xl:h-full">
      {/* At xl this column is a fixed 1/4-width grid cell (see dashboard.tsx),
          narrow enough that the two cards always belong stacked — xl:grid-cols-1
          pins that regardless of container width, and xl:grid-rows-2 xl:h-full
          split the row's full height evenly between them. */}
      <div
        className={`grid h-full grid-cols-1 gap-4 xl:grid-rows-2 ${stacked ? "" : "xl:grid-cols-1 @sm:grid-cols-2 @sm:grid-rows-1"}`}
      >
        <TransactionsSummary filters={filters} />
        <BankStatementsSummary />
      </div>
    </div>
  );
}
