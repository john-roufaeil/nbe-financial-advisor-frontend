import { useRef, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBankStatements } from "@/queries/bank-statements";
import { Pagination } from "@/components/data/Pagination";
import { BankStatementDetailModal } from "@/components/data/BankStatementDetailModal";
import { BankStatementCard } from "@/components/data/BankStatementCard";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { CardGridSkeleton } from "@/components/shared/skeletons/CardGridSkeleton";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";
import { useViewModeStore } from "@/store/use-view-mode-store";
import { useLoadAnimation } from "@/lib/use-load-animation";
import { useBankStatementFilters } from "@/lib/use-bank-statement-filters";

/** List = single column of rows; grid = responsive cards. */
const VIEW_CONTAINER = {
  list: "flex flex-col gap-2",
  grid: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
} as const;

export function BankStatementsTab() {
  const { t } = useTranslation();
  const f = useBankStatementFilters();
  const detailModalRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const viewMode = useViewModeStore((s) => s.mode);

  const { data, isPending, isError, refetch } = useBankStatements({
    type: f.filter === "all" ? undefined : f.filter,
    q: f.search.trim() || undefined,
    from: f.fromDate || undefined,
    to: f.toDate || undefined,
    sort: f.sort,
    offset: (f.page - 1) * f.pageSize,
    limit: f.pageSize,
  });
  const loadAnimation = useLoadAnimation(isPending);

  function openDetail(id: string) {
    setSelectedId(id);
    detailModalRef.current?.showModal();
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / f.pageSize));

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="border-base-300 bg-base-100 animate-entry rounded-xl border shadow-sm">
        <DataToolbar
          search={f.searchInput}
          onSearchChange={f.updateSearch}
          fromDate={f.fromDate}
          onFromDateChange={f.updateFromDate}
          toDate={f.toDate}
          onToDateChange={f.updateToDate}
          filters={f.FILTERS}
          filter={f.filter}
          onFilterChange={f.updateFilter}
          filterLabel={(value) => t(`data.filters.${value}`)}
          sort={f.sort}
          onSortChange={f.setSort}
          hasActiveFilters={f.hasActiveFilters}
          onClearAll={f.clearAllFilters}
        />
        <Pagination
          attached
          page={f.page}
          totalPages={totalPages}
          total={data?.total ?? 0}
          pageSize={f.pageSize}
          onPageChange={f.setPage}
          onPageSizeChange={f.updatePageSize}
          totalLabelKey="data.pagination.totalBankStatements"
        />
      </div>

      {isPending ? (
        viewMode === "grid" ? (
          <CardGridSkeleton />
        ) : (
          <ListSkeleton />
        )
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.items.length > 0 ? (
        <ul className={`${loadAnimation} ${VIEW_CONTAINER[viewMode]}`}>
          {data.items.map((doc) => (
            <BankStatementCard
              key={doc.id}
              doc={doc}
              view={viewMode}
              onOpen={() => openDetail(doc.id)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={FileText}
          label={t("data.bankStatementsEmpty")}
          className={loadAnimation}
        />
      )}

      <Pagination
        page={f.page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        pageSize={f.pageSize}
        onPageChange={f.setPage}
        onPageSizeChange={f.updatePageSize}
        totalLabelKey="data.pagination.totalBankStatements"
      />

      <BankStatementDetailModal ref={detailModalRef} bankStatementId={selectedId} />
    </div>
  );
}
