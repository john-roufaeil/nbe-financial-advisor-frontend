import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { History, LayoutDashboard, Bot, Rocket, PiggyBank } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useBudget, useBudgetHistory } from "@/queries/budget";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { Pagination } from "@/components/shared/layout/Pagination";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { BudgetHistoryEntry } from "@/types/budget";

const CHANGED_VIA_ICON: Record<BudgetHistoryEntry["changedVia"], LucideIcon> = {
  dashboard: LayoutDashboard,
  chat: Bot,
  onboarding: Rocket,
};

const CHANGED_VIA_ICON_CLASS: Record<BudgetHistoryEntry["changedVia"], string> = {
  dashboard: "bg-primary/10 text-primary",
  chat: "bg-secondary/10 text-secondary",
  onboarding: "bg-accent/10 text-accent",
};

/** Shared shell for one timeline node (dot + connector line + content) so the
 * current allocation and past changes render as one continuous timeline. */
function TimelineNode({
  icon: Icon,
  iconClassName,
  isLast,
  children,
}: {
  icon: LucideIcon;
  iconClassName: string;
  isLast: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className={`relative flex gap-3 ${isLast ? "" : "pb-5"}`}>
      {!isLast && (
        <span
          className="bg-base-300 absolute inset-s-4 top-8 bottom-0 w-px"
          aria-hidden="true"
        />
      )}
      <span
        className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ${iconClassName}`}
      >
        <Icon data-no-flip className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">{children}</div>
    </li>
  );
}

function AllocationPills({
  allocations,
}: {
  allocations: { category: string; percentage: number }[];
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {allocations.map((a) => (
        <li
          key={a.category}
          className="bg-base-200 flex items-center gap-1 rounded-full px-2 py-1 text-xs"
        >
          <CategoryLabel
            category={a.category}
            type="expense"
            iconClassName="size-3 shrink-0 opacity-60"
          />
          <span className="font-medium tabular-nums">{a.percentage}%</span>
        </li>
      ))}
    </ul>
  );
}

function CurrentAllocationNode({
  allocations,
  isLast,
}: {
  allocations: { category: string; percentage: number }[];
  isLast: boolean;
}) {
  const { t } = useTranslation();
  return (
    <TimelineNode
      icon={PiggyBank}
      iconClassName="bg-primary text-primary-content"
      isLast={isLast}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="badge badge-primary badge-sm">
          {t("budget.history.current")}
        </span>
      </div>
      <p className="text-base-content/60 text-xs">
        {t("budget.history.currentAllocationsLabel")}
      </p>
      <AllocationPills allocations={allocations} />
    </TimelineNode>
  );
}

function HistoryTimelineNode({
  entry,
  isLast,
}: {
  entry: BudgetHistoryEntry;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);

  return (
    <TimelineNode
      icon={CHANGED_VIA_ICON[entry.changedVia]}
      iconClassName={CHANGED_VIA_ICON_CLASS[entry.changedVia]}
      isLast={isLast}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium">
          {t(`budget.history.changedVia.${entry.changedVia}`)}
        </span>
        <span className="text-base-content/40">·</span>
        <span className="text-base-content/50">
          {formatDateTime(entry.changedAt, timeFormat, t, dateFormat)}
        </span>
      </div>
      <p className="text-base-content/60 text-xs">
        {t("budget.history.previousStateLabel")}
      </p>
      <AllocationPills
        allocations={entry.previousAllocations.map((a) => ({
          category: a.category,
          percentage: a.allocatedPercentage,
        }))}
      />
    </TimelineNode>
  );
}

export function BudgetHistorySection() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  const { data: budget, isPending: budgetPending, error: budgetError } = useBudget();
  const {
    data,
    isPending: historyPending,
    isError,
    refetch,
  } = useBudgetHistory({
    limit: pageSize,
    offset,
  });

  const noBudgetYet = isAxiosError(budgetError) && budgetError.response?.status === 404;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isPending = budgetPending || historyPending;

  return (
    <div className="animate-entry flex h-full flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-lg">
          <History data-no-flip className="size-4" />
        </span>
        {t("budget.history.title")}
      </h2>

      {isPending ? (
        <ListSkeleton rows={4} />
      ) : noBudgetYet ? (
        <EmptyState icon={History} label={t("budget.history.noBudget")} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !budget && (data?.items.length ?? 0) === 0 ? (
        <EmptyState icon={History} label={t("budget.history.empty")} />
      ) : (
        <>
          {/* Measured, not CSS auto-height, from budget.tsx — a grid row's
              auto height is sized from each item's max-content, which is
              defined to ignore overflow, so overflow-y-auto alone can't
              shrink this card's contribution to match its sibling. */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ol className="flex flex-col">
              {budget && (
                <CurrentAllocationNode
                  allocations={budget.allocations.map((a) => ({
                    category: a.category,
                    percentage: a.allocated_percentage,
                  }))}
                  isLast={(data?.items.length ?? 0) === 0}
                />
              )}
              {data?.items.map((entry, i) => (
                <HistoryTimelineNode
                  key={entry.id}
                  entry={entry}
                  isLast={i === data.items.length - 1}
                />
              ))}
            </ol>
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              totalLabelKey="budget.history.pagination.total"
              attached
            />
          )}
        </>
      )}
    </div>
  );
}
