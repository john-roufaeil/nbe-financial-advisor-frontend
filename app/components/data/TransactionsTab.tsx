import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/lib/format";
import type { Transaction } from "@/types/transaction";
import { useTransactions, useDeleteTransaction } from "@/queries/transactions";
import { Pagination } from "@/components/data/Pagination";
import { AddTransactionModal } from "@/components/data/AddTransactionModal";
import { DataToolbar } from "@/components/shared/DataToolbar";
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
import { useLoadAnimation } from "@/lib/use-load-animation";

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
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  view: ViewMode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const isIncome = transaction.type === "income";
  const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const currencyLabel = t("currency.EGP");
  const isGrid = view === "grid";

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
          {transaction.category} · {formatDateTime(transaction.datetime)}
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
      <button
        type="button"
        onClick={onEdit}
        className="btn btn-ghost btn-sm btn-square"
        aria-label={t("actions.edit")}
      >
        <Pencil data-no-flip className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="btn btn-ghost btn-sm btn-square text-error"
        aria-label={t("actions.delete", { name: transaction.title })}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );

  if (isGrid) {
    return (
      <li className="border-base-300 bg-base-100 flex flex-col gap-3 rounded-lg border p-3">
        {iconAndText}
        <div className="border-base-200 flex items-center gap-2 border-t pt-2">
          {amount}
          <div className="ms-auto">{actions}</div>
        </div>
      </li>
    );
  }

  return (
    <li className="border-base-300 bg-base-100 flex items-center gap-3 rounded-lg border p-3">
      {iconAndText}
      {amount}
      {actions}
    </li>
  );
}

export const TransactionsTab = forwardRef<TransactionsTabHandle>(
  function TransactionsTab(_props, ref) {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = usePageSizeStore((s) => s.pageSize);
    const setPageSize = usePageSizeStore((s) => s.setPageSize);
    const confirm = useConfirmStore((s) => s.confirm);
    const viewMode = useViewModeStore((s) => s.mode);
    const modalRef = useRef<HTMLDialogElement>(null);
    const [editing, setEditing] = useState<Transaction | null>(null);

    const { data, isPending, isError, refetch } = useTransactions({
      type: filter === "all" ? undefined : filter,
      q: search.trim() || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });
    const loadAnimation = useLoadAnimation(isPending);
    const deleteTransaction = useDeleteTransaction();

    useImperativeHandle(ref, () => ({
      openAdd: () => {
        setEditing(null);
        modalRef.current?.showModal();
      },
    }));

    function openEdit(tr: Transaction) {
      setEditing(tr);
      modalRef.current?.showModal();
    }

    const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

    function updatePageSize(size: number) {
      setPageSize(size);
      setPage(1);
    }

    function updateSearch(value: string) {
      setSearch(value);
      setPage(1);
    }
    function updateFilter(value: Filter) {
      setFilter(value);
      setPage(1);
    }
    function updateFromDate(value: string) {
      setFromDate(value);
      setPage(1);
    }
    function updateToDate(value: string) {
      setToDate(value);
      setPage(1);
    }

    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="border-base-300 bg-base-100 animate-entry overflow-hidden rounded-2xl border shadow-sm">
          <DataToolbar
            search={search}
            onSearchChange={updateSearch}
            fromDate={fromDate}
            onFromDateChange={updateFromDate}
            toDate={toDate}
            onToDateChange={updateToDate}
            filters={FILTERS}
            filter={filter}
            onFilterChange={updateFilter}
            filterLabel={(f) => t(`data.filters.${f}`)}
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

        <AddTransactionModal ref={modalRef} editing={editing} />
      </div>
    );
  },
);
