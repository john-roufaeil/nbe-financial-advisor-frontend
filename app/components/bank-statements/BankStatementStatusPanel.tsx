import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, TriangleAlert, RotateCcw, Upload } from "lucide-react";
import {
  BANK_STATEMENT_UPLOAD_ACCEPT,
  BANK_STATEMENT_STATUS,
  type BankStatement,
} from "@/types/bank-statement";
import { Button } from "@/components/shared/Button";

/** Renders the uploading/processing spinner or the failed-upload/failed-processing
 * recovery view for a statement — the states before it reaches "processed". */
export function BankStatementStatusPanel({
  doc,
  reuploadInputRef,
  onReupload,
  uploadPending,
  deletePending,
  onRetry,
  retryPending,
}: {
  doc: BankStatement;
  reuploadInputRef: RefObject<HTMLInputElement | null>;
  onReupload: (file: File | undefined) => void;
  uploadPending: boolean;
  deletePending: boolean;
  onRetry: () => void;
  retryPending: boolean;
}) {
  const { t } = useTranslation();

  if (
    doc.status === BANK_STATEMENT_STATUS.uploading ||
    doc.status === BANK_STATEMENT_STATUS.processing
  ) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Loader2 data-no-flip className="text-primary size-8 animate-spin" />
        <p className="text-base-content/60 text-sm">
          {doc.status === BANK_STATEMENT_STATUS.uploading
            ? t("bankStatements.detail.uploading")
            : t("bankStatements.detail.processing")}
        </p>
      </div>
    );
  }

  if (doc.status !== BANK_STATEMENT_STATUS.failed) return null;

  if (doc.failedStage === "upload") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <TriangleAlert className="text-error size-8" />
        <p className="font-medium">{t("bankStatements.detail.uploadFailedTitle")}</p>
        <p className="text-base-content/60 mx-auto w-2/3 text-sm text-balance">
          {t(`bankStatements.detail.${doc.errorMessage ?? "uploadFailedGeneric"}`)}
        </p>
        <input
          ref={reuploadInputRef}
          type="file"
          accept={BANK_STATEMENT_UPLOAD_ACCEPT}
          className="hidden"
          onChange={(e) => onReupload(e.target.files?.[0])}
        />
        <Button
          type="button"
          onClick={() => reuploadInputRef.current?.click()}
          loading={uploadPending || deletePending}
          className="btn btn-primary btn-sm gap-2"
        >
          <Upload className="size-4" />
          {t("bankStatements.detail.uploadAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <TriangleAlert className="text-error size-8" />
      <p className="font-medium">{t("bankStatements.detail.failedTitle")}</p>
      <p className="text-base-content/60 mx-auto w-2/3 text-sm text-balance">
        {t(`bankStatements.detail.${doc.errorMessage ?? "bankStatementFailedGeneric"}`)}
      </p>
      <Button
        type="button"
        onClick={onRetry}
        loading={retryPending}
        className="btn btn-primary btn-sm gap-2"
      >
        <RotateCcw className="size-4" />
        {t("bankStatements.detail.retry")}
      </Button>
    </div>
  );
}
