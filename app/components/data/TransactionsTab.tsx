import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/lib/format";
import type { Transaction } from "@/types/transaction";
import { AMOUNT_RANGES, TRANSACTION_CATEGORIES } from "@/types/transaction";
import { useTransactions, useDeleteTransaction } from "@/queries/transactions";
import { useAccounts } from "@/queries/accounts";
import { Pagination } from "@/components/data/Pagination";
import { AddTransactionModal } from "@/components/data/AddTransactionModal";
import { TransactionDetailModal } from "@/components/data/TransactionDetailModal";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { Tooltip } from "@/components/shared/Tooltip";
import { useConfirmStore } from "@/store/use-confirm-store";
import {
  ListSkeleton,
  CardGridSkeleton,
  ErrorState,
  EmptyState,
} from "@/components/shared/QueryState";
import { Money } from "@/components/shared/Money";
import { useViewModeStore, type ViewMode } from "@/store/use-view-mode-store";
import { usePageSizeStore } from "@/store/use-page-size-store";
import { useTimeFormatStore } from "@/store/use-time-format-store";
import { useLoadAnimation } from "@/lib/use-load-animation";
import { useDebouncedValue } from "@/lib/use-debounced-value";

/** List = single column of rows; grid = responsive cards. */
const VIEW_CONTAINER = {
  list: "flex flex-col gap-2",
  grid: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
} as const;

const FILTERS = ["all", "income", "expense"] as const;
type Filter = (typeof FILTERS)[number];

export interface TransactionsTabHandle {
  openAdd: () => void;
}

function TransactionCard({
  transaction,
  view,
  onOpen,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  view: ViewMode;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const isIncome = transaction.type === "income";
  const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const { data: accounts } = useAccounts();
  const account = accounts?.find((a) => a.id === transaction.accountId);
  const currencyLabel = t(
    `currency.${account?.currency ?? "EGP"}`,
    account?.currency ?? "EGP",
  );
  const isGrid = view === "grid";
  const timeFormat = useTimeFormatStore((s) => s.format);

  const iconAndText = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        data-no-flip
        className={`grid size-9 shrink-0 place-items-center rounded-full ${
          isIncome ? "bg-success/10 text-success" : "bg-error/10 text-error"
        }`}
      >
        <Icon data-no-flip className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{transaction.title}</p>
        <p className="text-base-content/50 text-xs">
          {t(`data.categories.${transaction.category}`, transaction.category)} ·{" "}
          {formatDateTime(transaction.datetime, timeFormat, t)}
        </p>
      </div>
    </div>
  );

  const amount = (
    <Money
      className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? "text-success" : "text-base-content"}`}
    >
      <span dir="ltr">
        {isIncome ? "+" : "-"}
        {transaction.amount.toLocaleString()}
      </span>{" "}
      {currencyLabel}
    </Money>
  );

  const actions = (
    <div className="flex shrink-0 items-center gap-1">
      <Tooltip content={t("actions.edit")}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="btn btn-ghost btn-sm btn-square"
          aria-label={t("actions.edit")}
        >
          <Pencil data-no-flip className="size-4" />
        </button>
      </Tooltip>
      <Tooltip content={t("actions.delete", { name: transaction.title })}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="btn btn-ghost btn-sm btn-square text-error"
          aria-label={t("actions.delete", { name: transaction.title })}
        >
          <Trash2 className="size-4" />
        </button>
      </Tooltip>
    </div>
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLLIElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  }

  if (isGrid) {
    return (
      <li
        onClick={onOpen}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="button"
        className="border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer flex-col gap-3 rounded-md border p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {iconAndText}
        <div className="border-base-200 flex items-center gap-2 border-t pt-2">
          {amount}
          <div className="ms-auto">{actions}</div>
        </div>
      </li>
    );
  }

  return (
    <li
      onClick={onOpen}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      className="border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {iconAndText}
      {amount}
      {actions}
    </li>
  );
}

export const TransactionsTab = forwardRef<TransactionsTabHandle>(
  function TransactionsTab(_props, ref) {
    const { t } = useTranslation();
    const [searchInput, setSearchInput] = useState("");
    const search = useDebouncedValue(searchInput, 1000);
    const [filter, setFilter] = useState<Filter>("all");
    const [category, setCategory] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [amountRange, setAmountRange] = useState("any");
    const [sort, setSort] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const pageSize = usePageSizeStore((s) => s.pageSize);
    const setPageSize = usePageSizeStore((s) => s.setPageSize);
    const confirm = useConfirmStore((s) => s.confirm);
    const viewMode = useViewModeStore((s) => s.mode);
    const modalRef = useRef<HTMLDialogElement>(null);
    const [editing, setEditing] = useState<Transaction | null>(null);
    const detailModalRef = useRef<HTMLDialogElement>(null);
    const [viewing, setViewing] = useState<Transaction | null>(null);
    const [detailModalKey, setDetailModalKey] = useState<number | null>(null);
    // null = no open pending. A plain boolean ref to skip the mount run would
    // break under StrictMode's dev-only double-invoke of mount effects (the
    // ref flips on the first pass, so the duplicate pass reopens the modal
    // unconditionally) — state doesn't have that problem.
    const [modalKey, setModalKey] = useState<number | null>(null);

    useEffect(() => {
      if (modalKey === null) return;
      modalRef.current?.showModal();
    }, [modalKey]);

    useEffect(() => {
      if (detailModalKey === null) return;
      detailModalRef.current?.showModal();
    }, [detailModalKey]);

    const selectedAmountRange = AMOUNT_RANGES.find((r) => r.key === amountRange);

    const { data, isPending, isError, refetch } = useTransactions({
      type: filter === "all" ? undefined : filter,
      category: category || undefined,
      q: search.trim() || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      minAmount: selectedAmountRange?.min,
      maxAmount: selectedAmountRange?.max,
      sort,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });
    const loadAnimation = useLoadAnimation(isPending);
    const deleteTransaction = useDeleteTransaction();

    useImperativeHandle(ref, () => ({
      openAdd: () => {
        setEditing(null);
        setModalKey((k) => (k ?? 0) + 1);
      },
    }));

    function openEdit(tr: Transaction) {
      setEditing(tr);
      setModalKey((k) => (k ?? 0) + 1);
    }

    function openDetail(tr: Transaction) {
      setViewing(tr);
      setDetailModalKey((k) => (k ?? 0) + 1);
    }

    const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

    function updatePageSize(size: number) {
      setPageSize(size);
      setPage(1);
    }

    function updateSearch(value: string) {
      setSearchInput(value);
      setPage(1);
    }
    function updateFilter(value: Filter) {
      setFilter(value);
      setPage(1);
    }
    function updateCategory(value: string) {
      setCategory(value);
      setPage(1);
    }
    function updateFromDate(value: string) {
      setFromDate(value);
      if (toDate && value > toDate) setToDate(value);
      setPage(1);
    }
    function updateToDate(value: string) {
      setToDate(value);
      if (fromDate && value < fromDate) setFromDate(value);
      setPage(1);
    }
    function updateAmountRange(value: string) {
      setAmountRange(value);
      setPage(1);
    }

    const hasActiveFilters =
      searchInput !== "" ||
      filter !== "all" ||
      category !== "" ||
      fromDate !== "" ||
      toDate !== "" ||
      amountRange !== "any";

    function clearAllFilters() {
      setSearchInput("");
      setFilter("all");
      setCategory("");
      setFromDate("");
      setToDate("");
      setAmountRange("any");
      setPage(1);
    }

    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="border-base-300 bg-base-100 animate-entry rounded-xl border shadow-sm">
          <DataToolbar
            search={searchInput}
            onSearchChange={updateSearch}
            fromDate={fromDate}
            onFromDateChange={updateFromDate}
            toDate={toDate}
            onToDateChange={updateToDate}
            filters={FILTERS}
            filter={filter}
            onFilterChange={updateFilter}
            filterLabel={(f) => t(`data.filters.${f}`)}
            categories={TRANSACTION_CATEGORIES}
            category={category}
            onCategoryChange={updateCategory}
            categoryLabel={(c) => t(`data.categories.${c}`, c)}
            amountRanges={AMOUNT_RANGES.map((r) => ({
              key: r.key,
              label: t(`data.amountRanges.${r.key}`),
            }))}
            amountRange={amountRange}
            onAmountRangeChange={updateAmountRange}
            sort={sort}
            onSortChange={setSort}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAllFilters}
          />
          <Pagination
            attached
            page={page}
            totalPages={totalPages}
            total={data?.total ?? 0}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={updatePageSize}
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
                onOpen={() => openDetail(tr)}
                onEdit={() => openEdit(tr)}
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
          page={page}
          totalPages={totalPages}
          total={data?.total ?? 0}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={updatePageSize}
          totalLabelKey="data.pagination.totalTransactions"
        />

        <AddTransactionModal key={modalKey ?? 0} ref={modalRef} editing={editing} />
        <TransactionDetailModal
          key={`detail-${detailModalKey ?? 0}`}
          ref={detailModalRef}
          transaction={viewing}
        />
      </div>
    );
  },
);
