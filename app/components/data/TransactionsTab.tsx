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
import { ListSkeleton, ErrorState, EmptyState } from "@/components/shared/QueryState";
import { Money } from "@/components/shared/Money";

const PAGE_SIZE = 10;
const FILTERS = ["all", "income", "expense"] as const;
type Filter = (typeof FILTERS)[number];

export interface TransactionsTabHandle {
  openAdd: () => void;
}

function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const isIncome = transaction.type === "income";
  const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const currencyLabel = t("currency.EGP");

  return (
    <li className="border-base-300 bg-base-100 flex items-center gap-3 rounded-lg border p-3">
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
      <Money
        className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? "text-success" : "text-base-content"}`}
      >
        <span dir="ltr">
          {isIncome ? "+" : "-"}
          {transaction.amount.toLocaleString()} {currencyLabel}
        </span>
      </Money>
      <button
        type="button"
        onClick={onEdit}
        className="btn btn-ghost btn-sm btn-square shrink-0"
        aria-label={t("actions.edit")}
      >
        <Pencil data-no-flip className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="btn btn-ghost btn-sm btn-square text-error shrink-0"
        aria-label={t("actions.delete", { name: transaction.title })}
      >
        <Trash2 className="size-4" />
      </button>
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
    const confirm = useConfirmStore((s) => s.confirm);
    const modalRef = useRef<HTMLDialogElement>(null);
    const [editing, setEditing] = useState<Transaction | null>(null);

    const { data, isPending, isError, refetch } = useTransactions({
      type: filter === "all" ? undefined : filter,
      q: search.trim() || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
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

    const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

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
      <div className="flex flex-col gap-4">
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

        {isPending ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : data.items.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {data.items.map((tr) => (
              <TransactionCard
                key={tr.id}
                transaction={tr}
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
          <EmptyState icon={Receipt} label={t("data.transactionsEmpty")} />
        )}

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />

        <AddTransactionModal ref={modalRef} editing={editing} />
      </div>
    );
  },
);
