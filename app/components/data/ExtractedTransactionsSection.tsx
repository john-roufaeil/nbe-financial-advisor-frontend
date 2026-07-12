import { ArrowDownCircle, ArrowUpCircle, CircleCheck, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { BankStatement, ExtractedTransaction } from "@/types/bank-statement";
import { Money } from "@/components/shared/Money";
import { ExtractedTransactionRow } from "@/components/data/ExtractedTransactionRow";

/** Step 2 of the review flow: the (possibly editable) list of transactions
 * extracted from an already-processed statement, plus the approved banner. */
export function ExtractedTransactionsSection({
  doc,
  draft,
  onUpdate,
  onDelete,
  onAdd,
}: {
  doc: BankStatement;
  draft: ExtractedTransaction[];
  onUpdate: (txId: string, patch: Partial<Omit<ExtractedTransaction, "id">>) => void;
  onDelete: (txId: string) => void;
  onAdd: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      {!doc.approved && (
        <div>
          <p className="text-base-content/50 text-xs">
            {t("data.bankStatementDetail.stepOf", { current: 2, total: 2 })}
          </p>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        {doc.approved ? (
          <p className="text-success flex items-center gap-1.5 text-sm font-medium">
            <CircleCheck data-no-flip className="size-4" />
            {t("data.bankStatementDetail.approved")}
          </p>
        ) : (
          <div>
            <p className="text-sm font-medium">
              {t("data.bankStatementDetail.reviewTitle")}
            </p>
            <p className="text-base-content/60 text-xs">
              {t("data.bankStatementDetail.reviewSubtitle")}
            </p>
          </div>
        )}
        <span className="text-base-content/50 shrink-0 text-xs">
          {t("data.bankStatementDetail.transactionCount", { count: draft.length })}
        </span>
      </div>

      {draft.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {draft.map((tx) => {
            const isIncome = tx.type === "income";
            const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;
            if (!doc.canEditTransactions) {
              return (
                <li
                  key={tx.id}
                  className="border-base-300 bg-base-100 rounded-xl border p-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      data-no-flip
                      className={`grid size-9 shrink-0 place-items-center rounded-full ${isIncome ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}
                    >
                      <TypeIcon data-no-flip className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{tx.title}</p>
                      <p className="text-base-content/50 text-xs">
                        {t(`data.categories.${tx.category}`, tx.category)}
                      </p>
                    </div>
                    <Money
                      className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? "text-success" : "text-base-content"}`}
                    >
                      <span dir="ltr">
                        {isIncome ? "+" : "-"}
                        {tx.amount.toLocaleString()}
                      </span>{" "}
                      {t("currency.EGP")}
                    </Money>
                  </div>
                </li>
              );
            }
            return (
              <ExtractedTransactionRow
                key={tx.id}
                tx={tx}
                onUpdate={(patch) => onUpdate(tx.id, patch)}
                onDelete={() => onDelete(tx.id)}
              />
            );
          })}
        </ul>
      ) : (
        <p className="text-base-content/50 py-4 text-center text-sm">
          {t("data.bankStatementDetail.noTransactions")}
        </p>
      )}

      {doc.canAddTransactions && (
        <button
          type="button"
          onClick={onAdd}
          className="btn btn-ghost btn-sm w-fit gap-2 self-start"
        >
          <Plus className="size-4" />
          {t("data.bankStatementDetail.addTransaction")}
        </button>
      )}
    </div>
  );
}
