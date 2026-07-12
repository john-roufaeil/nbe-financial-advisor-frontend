import { forwardRef } from "react";
import { Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AMOUNT_RANGES, TRANSACTION_CATEGORIES } from "@/types/transaction";
import { useTransactions, useDeleteTransaction } from "@/queries/transactions";
import { Pagination } from "@/components/data/Pagination";
import { AddTransactionModal } from "@/components/data/AddTransactionModal";
import { TransactionDetailModal } from "@/components/data/TransactionDetailModal";
import { TransactionCard } from "@/components/data/TransactionCard";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { useConfirmStore } from "@/store/use-confirm-store";
import { ListSkeleton } from "@/components/shared/skeletons/ListSkeleton";
import { CardGridSkeleton } from "@/components/shared/skeletons/CardGridSkeleton";
import { ErrorState, EmptyState } from "@/components/shared/QueryState";
import { useViewModeStore } from "@/store/use-view-mode-store";
import { useLoadAnimation } from "@/lib/use-load-animation";
import { useTransactionFilters } from "@/lib/use-transaction-filters";
import {
  useTransactionModals,
  type TransactionsTabHandle,
} from "@/lib/use-transaction-modals";

/** List = single column of rows; grid = responsive cards. */
const VIEW_CONTAINER = {
  list: "flex flex-col gap-2",
  grid: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
} as const;

export const TransactionsTab = forwardRef<TransactionsTabHandle>(
  function TransactionsTab(_props, ref) {
    const { t } = useTranslation();
    const confirm = useConfirmStore((s) => s.confirm);
    const viewMode = useViewModeStore((s) => s.mode);
    const f = useTransactionFilters();
    const modals = useTransactionModals(ref);

    const { data, isPending, isError, refetch } = useTransactions({
      type: f.filter === "all" ? undefined : f.filter,
      category: f.category || undefined,
      q: f.search.trim() || undefined,
      from: f.fromDate || undefined,
      to: f.toDate || undefined,
      minAmount: f.selectedAmountRange?.min,
      maxAmount: f.selectedAmountRange?.max,
      sort: f.sort,
      offset: (f.page - 1) * f.pageSize,
      limit: f.pageSize,
    });
    const loadAnimation = useLoadAnimation(isPending);
    const deleteTransaction = useDeleteTransaction();

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
            categories={TRANSACTION_CATEGORIES}
            category={f.category}
            onCategoryChange={f.updateCategory}
            categoryLabel={(c) => t(`data.categories.${c}`, c)}
            amountRanges={AMOUNT_RANGES.map((r) => ({
              key: r.key,
              label: t(`data.amountRanges.${r.key}`),
            }))}
            amountRange={f.amountRange}
            onAmountRangeChange={f.updateAmountRange}
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
            totalLabelKey="data.pagination.totalTransactions"
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
            {data.items.map((tr) => (
              <TransactionCard
                key={tr.id}
                transaction={tr}
                view={viewMode}
                onOpen={() => modals.openDetail(tr)}
                onEdit={() => modals.openEdit(tr)}
                onDelete={() =>
                  confirm({
                    title: t("confirm.deleteTransactionTitle"),
                    message: t("confirm.deleteMessage"),
                    onConfirm: () => deleteTransaction.mutate(tr.id),
                  })
                }
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Receipt}
            label={t("data.transactionsEmpty")}
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
          totalLabelKey="data.pagination.totalTransactions"
        />

        <AddTransactionModal
          key={modals.modalKey ?? 0}
          ref={modals.modalRef}
          editing={modals.editing}
        />
        <TransactionDetailModal
          key={`detail-${modals.detailModalKey ?? 0}`}
          ref={modals.detailModalRef}
          transaction={modals.viewing}
        />
      </div>
    );
  },
);
