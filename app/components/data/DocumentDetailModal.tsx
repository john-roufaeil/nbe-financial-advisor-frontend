import { forwardRef, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  TriangleAlert,
  RotateCcw,
  Upload,
  CircleCheck,
  Plus,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import { TRANSACTION_CATEGORIES } from "@/types/transaction";
import { DOCUMENT_UPLOAD_ACCEPT, inferDocumentType } from "@/types/document";
import { Button } from "@/components/shared/Button";
import { useBankInfo } from "@/lib/banks";
import { BaseModal } from "@/components/shared/BaseModal";
import { useConfirmStore } from "@/store/use-confirm-store";
import { toastError } from "@/lib/toast";
import { Money } from "@/components/shared/Money";
import {
  useDocument,
  useRetryDocument,
  useUploadDocuments,
  useDeleteDocument,
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
  const uploadDocuments = useUploadDocuments();
  const deleteDocument = useDeleteDocument();
  const updateExtractedTransactionMutation = useUpdateExtractedTransaction();
  const deleteExtractedTransaction = useDeleteExtractedTransaction();
  const addExtractedTransaction = useAddExtractedTransaction();
  const approveDocument = useApproveDocument();
  const confirm = useConfirmStore((s) => s.confirm);
  const reuploadInputRef = useRef<HTMLInputElement>(null);
  const { label: bankLabel, logo: bankLogo } = useBankInfo(doc?.bankName);

  // Recovery for a failed *upload*: pick the file again, upload it fresh, then
  // drop the stale failed record. Processing failures use retry instead.
  async function handleReupload(oldId: string, file: File | undefined) {
    if (!file) return;
    const type = inferDocumentType(file);
    if (!type) {
      toastError("toast.genericError");
      return;
    }
    try {
      await uploadDocuments.mutateAsync([
        {
          name: file.name,
          type,
          sizeKb: Math.max(1, Math.round(file.size / 1024)),
          file,
        },
      ]);
      deleteDocument.mutate(oldId);
      reuploadInputRef.current?.closest("dialog")?.close();
    } catch {
      // uploadDocuments' onError already surfaced a toast; keep the modal open.
    }
  }

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

  const showApprove =
    doc?.status === "processed" &&
    !doc.approved &&
    doc.extractedTransactions &&
    doc.extractedTransactions.length > 0;

  return (
    <BaseModal
      ref={ref}
      icon={
        doc && (
          <img
            src={bankLogo}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover"
          />
        )
      }
      title={
        doc && (
          <span className="flex min-w-0 flex-col">
            <span className="truncate">{bankLabel}</span>
            <span className="text-base-content/50 truncate text-xs font-normal">
              {doc.name || t("data.documentFallbackName")}
            </span>
          </span>
        )
      }
      actions={
        showApprove ? (
          <Button
            type="button"
            onClick={() => approveDocument.mutate(doc.id)}
            loading={approveDocument.isPending}
            className="btn btn-primary btn-sm"
          >
            {t("data.documentDetail.approve")}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        {doc && (
          <>
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

            {doc.status === "failed" &&
              (doc.failedStage === "upload" ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <TriangleAlert className="text-error size-8" />
                  <p className="font-medium">
                    {t("data.documentDetail.uploadFailedTitle")}
                  </p>
                  <p className="text-base-content/60 mx-auto w-2/3 text-sm text-balance">
                    {t(
                      `data.documentDetail.${doc.errorMessage ?? "uploadFailedGeneric"}`,
                    )}
                  </p>
                  <input
                    ref={reuploadInputRef}
                    type="file"
                    accept={DOCUMENT_UPLOAD_ACCEPT}
                    className="hidden"
                    onChange={(e) => handleReupload(doc.id, e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    onClick={() => reuploadInputRef.current?.click()}
                    loading={uploadDocuments.isPending || deleteDocument.isPending}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <Upload className="size-4" />
                    {t("data.documentDetail.uploadAgain")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <TriangleAlert className="text-error size-8" />
                  <p className="font-medium">{t("data.documentDetail.failedTitle")}</p>
                  <p className="text-base-content/60 mx-auto w-2/3 text-sm text-balance">
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
              ))}

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
              </div>
            )}
          </>
        )}
      </div>
    </BaseModal>
  );
});
