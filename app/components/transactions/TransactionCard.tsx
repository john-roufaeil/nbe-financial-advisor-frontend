import { ArrowDownCircle, ArrowUpCircle, Pencil, Repeat, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import type { Transaction } from "@/types/transaction";
import { useAccounts } from "@/queries/accounts";
import { Tooltip } from "@/components/shared/Tooltip";
import { Money } from "@/components/shared/Money";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { ClickableListItem } from "@/components/shared/ClickableListItem";
import {
  useDisplayPreferencesStore,
  type ViewMode,
} from "@/store/use-display-preferences-store";

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
  // Synced-account transactions are backend-rejected on edit/delete
  // (assert_account_mutable()) — hide the controls rather than let them 403.
  // Individually-synchronized transactions (source === "synchronized") are
  // rejected the same way regardless of the account's own link_type.
  const isReadOnly =
    account?.link_type === "synced" || transaction.source === "synchronized";
  const currencyLabel = t(
    `currency.${account?.currency ?? "EGP"}`,
    account?.currency ?? "EGP",
  );
  const isGrid = view === "grid";
  const timeFormat = useDisplayPreferencesStore((s) => s.timeFormat);
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const density = useDisplayPreferencesStore((s) => s.density);
  const isCompact = density === "compact";
  const formatN = useNumberDisplay();

  const iconAndText = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span
        data-no-flip
        className={`grid shrink-0 place-items-center rounded-full ${isCompact ? "size-7" : "size-9"} ${
          isIncome ? "bg-success/10 text-success" : "bg-error/10 text-error"
        }`}
      >
        <Icon data-no-flip className={isCompact ? "size-4" : "size-5"} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.title}
          {transaction.isRecurring && (
            <Tooltip content={t("transactions.add.recurring")}>
              <Repeat
                data-no-flip
                className="text-base-content/40 ms-1.5 inline size-3 shrink-0 align-middle"
              />
            </Tooltip>
          )}
        </p>
        {!isCompact && (
          <p className="text-base-content/50 flex min-w-0 items-center gap-1 text-xs">
            <CategoryLabel
              category={transaction.category}
              type={transaction.type}
              iconClassName="size-3 shrink-0 opacity-60"
            />
            <span className="shrink-0">
              · {formatDateTime(transaction.datetime, timeFormat, t, dateFormat)}
            </span>
          </p>
        )}
      </div>
    </div>
  );

  const amount = (
    <Money
      className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? "text-success" : "text-base-content"}`}
    >
      <span dir="ltr">
        {isIncome ? "+" : "-"}
        {formatN(transaction.amount)}
      </span>{" "}
      {currencyLabel}
    </Money>
  );

  const actions = isReadOnly ? (
    <div className="relative z-10 flex shrink-0 items-center gap-1">
      <Tooltip content={t("transactions.synced")}>
        <span className="badge badge-ghost text-xs">{t("transactions.synced")}</span>
      </Tooltip>
    </div>
  ) : (
    <div className="relative z-10 flex shrink-0 items-center gap-1">
      <Tooltip content={t("actions.edit")}>
        <button
          type="button"
          onClick={onEdit}
          className="btn btn-ghost btn-sm btn-square"
          aria-label={t("actions.edit")}
        >
          <Pencil data-no-flip className="size-4" />
        </button>
      </Tooltip>
      <Tooltip content={t("actions.delete", { name: transaction.title })}>
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-ghost btn-sm btn-square text-error"
          aria-label={t("actions.delete", { name: transaction.title })}
        >
          <Trash2 className="size-4" />
        </button>
      </Tooltip>
    </div>
  );

  if (isGrid) {
    return (
      <ClickableListItem
        onActivate={onOpen}
        activateLabel={t("actions.viewDetails", { name: transaction.title })}
        className={`border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer flex-col rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isCompact ? "gap-2 p-2" : "gap-3 p-3"}`}
      >
        {iconAndText}
        <div className="border-base-200 flex items-center gap-2 border-t pt-2">
          {amount}
          <div className="ms-auto">{actions}</div>
        </div>
      </ClickableListItem>
    );
  }

  return (
    <ClickableListItem
      onActivate={onOpen}
      activateLabel={t("actions.viewDetails", { name: transaction.title })}
      className={`border-base-300 bg-base-100 hover:border-primary focus-visible:outline-primary/50 flex cursor-pointer items-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isCompact ? "gap-2 p-2" : "gap-3 p-3"}`}
    >
      {iconAndText}
      {amount}
      {actions}
    </ClickableListItem>
  );
}
