import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  TriangleAlert,
  RotateCcw,
  CircleCheck,
  X,
  Plus,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { TRANSACTION_CATEGORIES } from "@/types/transaction";
import { Button } from "@/components/shared/Button";
import { getBankLogo, getBankName } from "@/lib/banks";
import { useConfirmStore } from "@/store/use-confirm-store";
import { Money } from "@/components/shared/Money";
import {
  useDocument,
  useRetryDocument,
  useUpdateExtractedTransaction,
  useDeleteExtractedTransaction,
  useAddExtractedTransaction,
  useApproveDocument,
} from "@/queries/documents";

export const DocumentDetailModal = forwardRef<
  HTMLDialogElement,
  { documentId: string | null }
>(function DocumentDetailModal({ documentId }, ref) {
  const { t } = useTranslation();
  const { data: doc } = useDocument(documentId);
  const retryDocument = useRetryDocument();
  const updateExtractedTransactionMutation = useUpdateExtractedTransaction();
  const deleteExtractedTransaction = useDeleteExtractedTransaction();
  const addExtractedTransaction = useAddExtractedTransaction();
  const approveDocument = useApproveDocument();
  const confirm = useConfirmStore((s) => s.confirm);

  function updateExtractedTransaction(
    docId: string,
    txId: string,
    patch: Parameters<typeof updateExtractedTransactionMutation.mutate>[0]["patch"],
  ) {
    updateExtractedTransactionMutation.mutate({
      documentId: docId,
      transactionId: txId,
      patch,
    });
  }

  return (
    <dialog ref={ref} className="modal">
      <div className="modal-box relative flex max-w-xl flex-col gap-4">
        <form method="dialog">
          <button
            className="btn btn-ghost btn-sm btn-circle absolute end-2 top-2"
            aria-label={t("actions.close")}
          >
            <X data-no-flip className="size-4" />
          </button>
        </form>

        {doc && (
          <>
            <div className="flex items-center gap-3 pe-8">
              <img
                src={getBankLogo(doc.bankName)}
                alt={
                  doc.bankName
                    ? t(
                        `banks.${doc.bankName}`,
                        getBankName(doc.bankName) ?? doc.bankName,
                      )
                    : ""
                }
                className="size-9 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">
                  {doc.name || t("data.documentFallbackName")}
                </h3>
                {doc.bankName && (
                  <p className="text-base-content/50 truncate text-xs">
                    {t(
                      `banks.${doc.bankName}`,
                      getBankName(doc.bankName) ?? doc.bankName,
                    )}
                  </p>
                )}
              </div>
            </div>

            {(doc.status === "uploading" || doc.status === "processing") && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 data-no-flip className="text-primary size-8 animate-spin" />
                <p className="text-base-content/60 text-sm">
                  {doc.status === "uploading"
                    ? t("data.documentDetail.uploading")
                    : t("data.documentDetail.processing")}
                </p>
              </div>
            )}

            {doc.status === "failed" && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <TriangleAlert className="text-error size-8" />
                <p className="font-medium">{t("data.documentDetail.failedTitle")}</p>
                <p className="text-base-content/60 text-sm">
                  {t(
                    `data.documentDetail.${doc.errorMessage ?? "documentFailedGeneric"}`,
                  )}
                </p>
                <Button
                  type="button"
                  onClick={() => retryDocument.mutate(doc.id)}
                  loading={retryDocument.isPending}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <RotateCcw className="size-4" />
                  {t("data.documentDetail.retry")}
                </Button>
              </div>
            )}

            {doc.status === "processed" && (
              <div className="flex flex-col gap-3">
                {doc.approved ? (
                  <p className="text-success flex items-center gap-1.5 text-sm font-medium">
                    <CircleCheck data-no-flip className="size-4" />
                    {t("data.documentDetail.approved")}
                  </p>
                ) : (
                  <div>
                    <p className="text-sm font-medium">
                      {t("data.documentDetail.reviewTitle")}
                    </p>
                    <p className="text-base-content/60 text-xs">
                      {t("data.documentDetail.reviewSubtitle")}
                    </p>
                  </div>
                )}

                {doc.extractedTransactions && doc.extractedTransactions.length > 0 ? (
                  <ul className="flex flex-col gap-3">
                    {doc.extractedTransactions.map((tx) => {
                      const isIncome = tx.type === "income";
                      const TypeIcon = isIncome ? ArrowUpCircle : ArrowDownCircle;
                      return (
                        <li
                          key={tx.id}
                          className="border-base-300 bg-base-100 rounded-xl border p-3 shadow-sm"
                        >
                          {!doc.canEditTransactions ? (
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
                                  {tx.category}
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
                          ) : (
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
                                  onChange={(e) =>
                                    updateExtractedTransaction(doc.id, tx.id, {
                                      title: e.target.value,
                                    })
                                  }
                                  className="input input-bordered input-sm w-full flex-1 font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    confirm({
                                      title: t("confirm.deleteTransactionTitle"),
                                      message: t("confirm.deleteMessage"),
                                      onConfirm: () =>
                                        deleteExtractedTransaction.mutate({
                                          documentId: doc.id,
                                          transactionId: tx.id,
                                        }),
                                    })
                                  }
                                  className="btn btn-ghost btn-sm btn-square text-error shrink-0"
                                  aria-label={t("actions.delete", { name: tx.title })}
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>

                              <div className="border-base-200 flex flex-wrap items-center gap-x-4 gap-y-2 border-t ps-10 pt-3">
                                <label className="flex items-center gap-1.5">
                                  <span className="text-base-content/50 text-xs">
                                    {t("data.addTransaction.category")}
                                  </span>
                                  <select
                                    value={tx.category}
                                    onChange={(e) =>
                                      updateExtractedTransaction(doc.id, tx.id, {
                                        category: e.target.value,
                                      })
                                    }
                                    className="select select-bordered select-xs"
                                  >
                                    {TRANSACTION_CATEGORIES.map((c) => (
                                      <option key={c} value={c}>
                                        {c}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <div className="join border-base-300 rounded-lg border">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateExtractedTransaction(doc.id, tx.id, {
                                        type: "expense",
                                      })
                                    }
                                    className={`btn btn-xs join-item cursor-pointer ${tx.type === "expense" ? "btn-error" : "btn-ghost"}`}
                                  >
                                    {t("data.filters.expense")}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateExtractedTransaction(doc.id, tx.id, {
                                        type: "income",
                                      })
                                    }
                                    className={`btn btn-xs join-item cursor-pointer ${tx.type === "income" ? "btn-success" : "btn-ghost"}`}
                                  >
                                    {t("data.filters.income")}
                                  </button>
                                </div>

                                <label className="ms-auto flex items-center gap-1.5">
                                  <span className="text-base-content/50 text-xs">
                                    {t("data.addTransaction.amount")}
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={tx.amount}
                                    onChange={(e) =>
                                      updateExtractedTransaction(doc.id, tx.id, {
                                        amount: Number(e.target.value),
                                      })
                                    }
                                    className="input input-bordered input-xs min-w-24"
                                    style={{
                                      width: `${Math.max(6, String(tx.amount).length + 3.5)}ch`,
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-base-content/50 py-4 text-center text-sm">
                    {t("data.documentDetail.noTransactions")}
                  </p>
                )}

                {doc.canAddTransactions && (
                  <button
                    type="button"
                    onClick={() =>
                      addExtractedTransaction.mutate({
                        documentId: doc.id,
                        body: {
                          datetime: `${doc.uploadDate.slice(0, 10)}T00:00:00`,
                          title: "",
                          category: TRANSACTION_CATEGORIES[0],
                          type: "expense",
                          amount: 0,
                        },
                      })
                    }
                    disabled={addExtractedTransaction.isPending}
                    className="btn btn-ghost btn-sm w-fit gap-2 self-start"
                  >
                    <Plus className="size-4" />
                    {t("data.documentDetail.addTransaction")}
                  </button>
                )}

                {!doc.approved &&
                  doc.extractedTransactions &&
                  doc.extractedTransactions.length > 0 && (
                    <div className="modal-action">
                      <Button
                        type="button"
                        onClick={() => approveDocument.mutate(doc.id)}
                        loading={approveDocument.isPending}
                        className="btn btn-primary btn-sm"
                      >
                        {t("data.documentDetail.approve")}
                      </Button>
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button className="cursor-default">{t("actions.close")}</button>
      </form>
    </dialog>
  );
});
