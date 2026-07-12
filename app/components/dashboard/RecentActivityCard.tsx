import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
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
import { formatDate } from "@/lib/format";

const RECENT_COUNT = 2;

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
  children: React.ReactNode;
}) {
  const isEmpty = count === 0;

  return (
    <Link
      to={to}
      // When empty, the whole card is the invitation to add the first item —
      // send it straight into the add flow instead of the (empty) list view.
      state={isEmpty ? { openAdd: true } : undefined}
      className="card border-base-300 bg-base-100 hover:border-primary group animate-entry h-40 border shadow-sm transition-colors"
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

function TransactionsSummary() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const { data, isPending } = useTransactions({ limit: RECENT_COUNT });

  if (isPending) return <CardSkeleton icon={ArrowLeftRight} className="animate-entry" />;

  return (
    <SummaryCard
      to={`/${lang}/transactions`}
      icon={ArrowLeftRight}
      color="bg-info/10 text-info"
      title={t("data.transactions")}
      count={data?.total ?? 0}
      countLabel={t("data.pagination.totalTransactions", { count: data?.total ?? 0 })}
      emptyIcon={Inbox}
      emptyLabel={t("data.transactionsEmptyShort")}
      emptyCtaLabel={t("data.transactionsEmptyCta")}
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
                {tx.amount.toLocaleString()}
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
  const { data, isPending } = useBankStatements({ limit: RECENT_COUNT });

  if (isPending) return <CardSkeleton icon={FileText} className="animate-entry" />;

  return (
    <SummaryCard
      to={`/${lang}/bank-statements`}
      icon={FileText}
      color="bg-secondary/10 text-secondary"
      title={t("data.bankStatements")}
      count={data?.total ?? 0}
      countLabel={t("data.pagination.totalBankStatements", { count: data?.total ?? 0 })}
      emptyIcon={FileX2}
      emptyLabel={t("data.bankStatementsEmptyShort")}
      emptyCtaLabel={t("data.bankStatementsEmptyCta")}
    >
      {data?.items.map((doc) => (
        <li key={doc.id}>
          <BankBadge
            bank={doc.bankName}
            size="size-6"
            subtitle={formatDate(doc.uploadDate)}
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
export function RecentActivityCard({ stacked = false }: { stacked?: boolean }) {
  return (
    <div className="@container">
      <div
        className={`grid grid-cols-1 gap-4 ${stacked ? "" : "@sm:grid-cols-2 @sm:grid-rows-1"}`}
      >
        <TransactionsSummary />
        <BankStatementsSummary />
      </div>
    </div>
  );
}
