import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, TriangleAlert, RotateCcw, CircleCheck } from "lucide-react";
import { TRANSACTION_CATEGORIES } from "@/lib/demo-transactions";
import { useDocumentsStore } from "@/store/use-documents-store";

export const DocumentDetailModal = forwardRef<
  HTMLDialogElement,
  { documentId: string | null }
>(function DocumentDetailModal({ documentId }, ref) {
  const { t } = useTranslation();
  const doc = useDocumentsStore((s) => s.documents.find((d) => d.id === documentId));
  const retryDocument = useDocumentsStore((s) => s.retryDocument);
  const updateExtractedTransaction = useDocumentsStore(
    (s) => s.updateExtractedTransaction,
  );
  const approveDocument = useDocumentsStore((s) => s.approveDocument);

  return (
    <dialog ref={ref} className="modal">
      <div className="modal-box flex max-w-xl flex-col gap-4">
        {doc && (
          <>
            <h3 className="truncate text-lg font-semibold">{doc.name}</h3>

            {(doc.status === "uploading" || doc.status === "processing") && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="text-primary size-8 animate-spin" />
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
                <button
                  type="button"
                  onClick={() => retryDocument(doc.id)}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <RotateCcw className="size-4" />
                  {t("data.documentDetail.retry")}
                </button>
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
                  <ul className="flex flex-col gap-2">
                    {doc.extractedTransactions.map((tx) => (
                      <li
                        key={tx.id}
                        className="border-base-300 bg-base-100 flex flex-col gap-2 rounded-lg border p-2.5"
                      >
                        {doc.approved ? (
                          <div className="flex items-center gap-3">
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {tx.title}
                            </span>
                            <span className="text-base-content/50 text-xs">
                              {tx.category}
                            </span>
                            <span
                              dir="ltr"
                              className={`shrink-0 text-sm font-semibold tabular-nums ${tx.type === "income" ? "text-success" : "text-base-content"}`}
                            >
                              {tx.type === "income" ? "+" : "-"}
                              {tx.amount.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={tx.title}
                              onChange={(e) =>
                                updateExtractedTransaction(doc.id, tx.id, {
                                  title: e.target.value,
                                })
                              }
                              className="input input-bordered input-sm w-full font-medium"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={tx.category}
                                onChange={(e) =>
                                  updateExtractedTransaction(doc.id, tx.id, {
                                    category: e.target.value,
                                  })
                                }
                                className="select select-bordered select-xs flex-1"
                              >
                                {TRANSACTION_CATEGORIES.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <div className="join border-base-300 shrink-0 rounded-lg border">
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
                                className="input input-bordered input-xs w-24 shrink-0"
                              />
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base-content/50 py-4 text-center text-sm">
                    {t("data.documentDetail.noTransactions")}
                  </p>
                )}

                {!doc.approved &&
                  doc.extractedTransactions &&
                  doc.extractedTransactions.length > 0 && (
                    <div className="modal-action">
                      <button
                        type="button"
                        onClick={() => approveDocument(doc.id)}
                        className="btn btn-primary btn-sm"
                      >
                        {t("data.documentDetail.approve")}
                      </button>
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
