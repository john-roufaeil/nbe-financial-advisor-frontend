import { forwardRef } from "react";
import { Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AMOUNT_RANGES, TRANSACTION_CATEGORIES } from "@/types/transaction";
import { useTransactions, useDeleteTransaction } from "@/queries/transactions";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { DataToolbar } from "@/components/shared/layout/DataToolbar";
import { PagedListSection } from "@/components/shared/layout/PagedListSection";
import { useConfirmStore } from "@/store/use-confirm-store";
import { useTransactionFilters } from "@/lib/use-transaction-filters";
import {
  useTransactionModals,
  type TransactionsTabHandle,
} from "@/lib/use-transaction-modals";

export const TransactionsTab = forwardRef<TransactionsTabHandle>(
  function TransactionsTab(_props, ref) {
    const { t } = useTranslation();
    const confirm = useConfirmStore((s) => s.confirm);
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
    const deleteTransaction = useDeleteTransaction();

    return (
      <PagedListSection
        toolbar={
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
            filterLabel={(value) => t(`common.filters.${value}`)}
            categories={TRANSACTION_CATEGORIES}
            category={f.category}
            onCategoryChange={f.updateCategory}
            categoryLabel={(c) => t(`common.categories.${c}`, c)}
            amountRanges={AMOUNT_RANGES.map((r) => ({
              key: r.key,
              label: t(`common.amountRanges.${r.key}`),
            }))}
            amountRange={f.amountRange}
            onAmountRangeChange={f.updateAmountRange}
            sort={f.sort}
            onSortChange={f.setSort}
            hasActiveFilters={f.hasActiveFilters}
            onClearAll={f.clearAllFilters}
          />
        }
        isPending={isPending}
        isError={isError}
        onRetry={() => refetch()}
        items={data?.items}
        total={data?.total}
        renderItem={(tr, viewMode) => (
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
        )}
        emptyIcon={Receipt}
        emptyLabel={t("transactions.empty")}
        page={f.page}
        pageSize={f.pageSize}
        onPageChange={f.setPage}
        onPageSizeChange={f.updatePageSize}
        totalLabelKey="transactions.pagination.total"
      >
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
      </PagedListSection>
    );
  },
);
