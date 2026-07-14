import { useTranslation } from "react-i18next";
import { Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { ExtractedTransaction } from "@/types/bank-statement";
import { TypeCategoryField } from "@/components/transactions/TypeCategoryField";
import { Tooltip } from "@/components/shared/Tooltip";
import { useConfirmStore } from "@/store/use-confirm-store";
import { MoneyInput } from "@/components/shared/forms/MoneyInput";
import { MAX_MONEY_VALUE } from "@/lib/format";

/** Rows here are edited purely in local state (see `draft` in the parent) —
 * nothing is sent to the server until "Approve" — so every keystroke is a
 * plain re-render with no network round trip. */
export function ExtractedTransactionRow({
  tx,
  currencyLabel,
  onUpdate,
  onDelete,
}: {
  tx: ExtractedTransaction;
  /** The statement's account currency (e.g. "EGP"), already localized. */
  currencyLabel: string;
  onUpdate: (patch: Partial<Omit<ExtractedTransaction, "id">>) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const isIncome = tx.type === "income";
  const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const amountInvalid = !Number.isFinite(tx.amount) || tx.amount <= 0;

  return (
    <li className="border-base-300 bg-base-100 rounded-xl border p-3 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span
            data-no-flip
            className={`grid size-8 shrink-0 place-items-center rounded-full ${isIncome ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
          >
            <TypeIcon data-no-flip className="size-4" />
          </span>
          <input
            type="text"
            value={tx.title}
            maxLength={20}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder={t("transactions.add.namePlaceholder")}
            className="input input-bordered input-sm w-full flex-1 font-medium"
          />
          <Tooltip content={t("actions.delete", { name: tx.title })} className="shrink-0">
            <button
              type="button"
              onClick={() =>
                confirm({
                  title: t("confirm.deleteTransactionTitle"),
                  message: t("confirm.deleteMessage"),
                  onConfirm: onDelete,
                })
              }
              className="btn btn-ghost btn-sm btn-square text-error"
              aria-label={t("actions.delete", { name: tx.title })}
            >
              <Trash2 className="size-4" />
            </button>
          </Tooltip>
        </div>

        <div className="border-base-200 flex flex-col gap-2 border-t ps-10 pt-3">
          <label className="flex w-full flex-col gap-1">
            <span className="text-base-content/50 text-xs">
              {t("transactions.add.amount")}
            </span>
            <MoneyInput
              value={tx.amount}
              max={MAX_MONEY_VALUE}
              onChange={(value) => onUpdate({ amount: value === "" ? 0 : value })}
              unit={currencyLabel}
              aria-label={t("transactions.add.amount")}
              className={`w-full ${amountInvalid ? "input-error" : ""}`}
            />
            {amountInvalid && (
              <span className="text-error text-xs">
                {t("transactions.add.errors.amountInvalid")}
              </span>
            )}
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-base-content/50 text-xs">
              {t("transactions.add.category")}
            </span>
            <TypeCategoryField
              size="xs"
              type={tx.type}
              category={tx.category}
              onTypeChange={(next, fallback) =>
                onUpdate({ type: next, ...(fallback ? { category: fallback } : {}) })
              }
              onCategoryChange={(c) => onUpdate({ category: c })}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
