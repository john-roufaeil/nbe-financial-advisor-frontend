import { forwardRef } from "react";
import { Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTransactions, useDeleteTransaction } from "@/queries/transactions";
import { useCategories } from "@/queries/categories";
import { useAccounts } from "@/queries/accounts";
import { getBankCode, getBankName } from "@/lib/banks";
import { TRANSACTION_SOURCES } from "@/types/transaction";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { TransactionDetailModal } from "@/components/transactions/TransactionDetailModal";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { DataToolbar } from "@/components/shared/layout/DataToolbar";
import { PagedListSection } from "@/components/shared/layout/PagedListSection";
import { useConfirmStore } from "@/store/use-confirm-store";
import { useTransactionFilters } from "@/lib/use-transaction-filters";
import { useConsumeTxFilterState } from "@/lib/use-consume-tx-filter-state";
import {
  useTransactionModals,
  type TransactionsTabHandle,
} from "@/lib/use-transaction-modals";

export const TransactionsTab = forwardRef<TransactionsTabHandle>(
  function TransactionsTab(_props, ref) {
    const { t } = useTranslation();
    const confirm = useConfirmStore((s) => s.confirm);
    // Dashboard drill-downs (a stat card, a budget category) arrive with
    // one-shot filters in navigation state; open the list pre-filtered.
    const drill = useConsumeTxFilterState();
    const f = useTransactionFilters(
      drill && {
        filter: drill.type,
        category: drill.category,
        fromDate: drill.from,
        toDate: drill.to,
      },
    );
    const modals = useTransactionModals(ref);
    // Category options narrow to the selected type filter; the API filters by
    // bare category name regardless of type, so an out-of-type option would
    // just silently return zero rows.
    const { data: allCategories } = useCategories();
    const visibleCategories = (allCategories ?? []).filter(
      (c) => f.filter === "all" || c.type === f.filter,
    );
    const categoryLabel = (name: string) => {
      const category = allCategories?.find((c) => c.name === name);
      const namespace = category?.type === "income" ? "incomeCategories" : "categories";
      return t(`common.${namespace}.${name}`, category?.label ?? name);
    };

    const { data: accounts } = useAccounts();
    const accountOptions = (accounts ?? []).map((a) => {
      const code = getBankCode(a.bank_name);
      const bankLabel = t(`banks.${code}`, getBankName(code) ?? a.bank_name);
      return { key: a.id, label: `${bankLabel} ${a.masked_account_number}` };
    });

    const sourceOptions = TRANSACTION_SOURCES.map((s) => ({
      key: s,
      label: t(`common.transactionSource.${s}`),
    }));
    // Switching to a type that doesn't have the currently-selected category
    // clears it back to "All categories" instead of leaving a dangling filter
    // that no longer appears in the (now-narrowed) dropdown.
    function updateFilterAndCategory(next: typeof f.filter) {
      f.updateFilter(next);
      if (
        f.category &&
        next !== "all" &&
        !allCategories?.some((c) => c.name === f.category && c.type === next)
      ) {
        f.updateCategory("");
      }
    }

    const { data, isPending, isError, isFetching, refetch } = useTransactions({
      type: f.filter === "all" ? undefined : f.filter,
      category: f.category || undefined,
      accountId: f.account || undefined,
      source: f.source || undefined,
      isRecurring: f.isRecurring || undefined,
      q: f.search.trim() || undefined,
      from: f.fromDate || undefined,
      to: f.toDate || undefined,
      minAmount: f.amountMin,
      maxAmount: f.amountMax,
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
            // "Search running" covers the debounce window (typed text not yet
            // applied) and the request the applied text is still fetching.
            searching={
              f.searchInput.trim() !== f.search.trim() ||
              (isFetching && f.search.trim() !== "")
            }
            fromDate={f.fromDate}
            onFromDateChange={f.updateFromDate}
            toDate={f.toDate}
            onToDateChange={f.updateToDate}
            filters={f.FILTERS}
            filter={f.filter}
            onFilterChange={updateFilterAndCategory}
            filterLabel={(value) => t(`common.filters.${value}`)}
            categories={visibleCategories.map((c) => c.name)}
            category={f.category}
            onCategoryChange={f.updateCategory}
            categoryLabel={categoryLabel}
            accounts={accountOptions}
            account={f.account}
            onAccountChange={f.updateAccount}
            sources={sourceOptions}
            source={f.source}
            onSourceChange={f.updateSource}
            recurringOnly={f.isRecurring}
            onRecurringOnlyChange={f.updateIsRecurring}
            amountMin={f.amountMinInput}
            onAmountMinChange={f.updateAmountMin}
            amountMax={f.amountMaxInput}
            onAmountMaxChange={f.updateAmountMax}
            sort={f.sort}
            onSortChange={f.setSort}
            hasActiveFilters={f.hasActiveFilters}
            onClearAll={f.clearAllFilters}
          />
        }
        isPending={isPending}
        isFetching={isFetching}
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
