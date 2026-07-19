import { FileText, CircleCheck, CircleAlert, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBankStatement } from "@/queries/bank-statements";
import { useStatementReviewStore } from "@/store/use-statement-review-store";
import { BANK_STATEMENT_STATUS } from "@/types/bank-statement";

/**
 * Surfaces a chat-uploaded statement's pipeline status inline under the
 * assistant's "I've started processing…" message, and — once the proposal is
 * ready — opens the SAME review modal the Bank Statements screen uses (via
 * use-statement-review-store, mounted once in ChatThread). It reuses
 * useBankStatement, which already polls while the statement is still
 * processing, so no extra polling logic lives here.
 */
export function ChatStatementCard({ statementId }: { statementId: string }) {
  const { t } = useTranslation();
  const { data: doc, isPending } = useBankStatement(statementId);
  const openReview = useStatementReviewStore((s) => s.open);

  const status = doc?.status;
  const isProcessing =
    isPending ||
    status === BANK_STATEMENT_STATUS.uploading ||
    status === BANK_STATEMENT_STATUS.processing;
  const isFailed = status === BANK_STATEMENT_STATUS.failed;
  const isApproved = status === BANK_STATEMENT_STATUS.processed && !!doc?.approved;
  const isReady = status === BANK_STATEMENT_STATUS.processed && !doc?.approved;

  return (
    <div className="border-base-300 bg-base-100 mt-2 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm shadow-sm">
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg ${
          isFailed
            ? "bg-error/10 text-error"
            : isApproved
              ? "bg-success/10 text-success"
              : "bg-primary/10 text-primary"
        }`}
      >
        {isProcessing ? (
          <Loader2 data-no-flip className="size-4.5 animate-spin" />
        ) : isFailed ? (
          <CircleAlert className="size-4.5" />
        ) : isApproved ? (
          <CircleCheck data-no-flip className="size-4.5" />
        ) : (
          <FileText className="size-4.5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {isProcessing
            ? t("chat.statement.processing")
            : isFailed
              ? t("chat.statement.failed")
              : isApproved
                ? t("chat.statement.added")
                : t("chat.statement.ready")}
        </p>
        {isFailed && doc?.errorMessage && (
          <p className="text-base-content/50 truncate text-xs">{doc.errorMessage}</p>
        )}
      </div>

      {isReady && (
        <button
          type="button"
          onClick={() => openReview(statementId)}
          className="btn btn-primary btn-sm shrink-0"
        >
          {t("chat.statement.review")}
        </button>
      )}
    </div>
  );
}
