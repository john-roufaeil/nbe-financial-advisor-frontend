import { ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/lib/format";
import type { Transaction } from "@/types/transaction";
import { useAccounts } from "@/queries/accounts";
import { Tooltip } from "@/components/shared/Tooltip";
import { Money } from "@/components/shared/Money";
import type { ViewMode } from "@/store/use-view-mode-store";
import { useTimeFormatStore } from "@/store/use-time-format-store";

export function TransactionCard({
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
