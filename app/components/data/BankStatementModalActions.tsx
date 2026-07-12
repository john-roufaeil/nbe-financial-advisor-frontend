import { useTranslation } from "react-i18next";
import { Button } from "@/components/shared/Button";
import type { ExtractedTransaction } from "@/types/bank-statement";

/** The single primary action shown in the modal footer: confirm-account (step 1)
 * or approve-and-add-to-transactions (step 2), whichever the statement is at. */
export function BankStatementModalActions({
  needsAccountConfirm,
  showApprove,
  selectedAccountId,
  draft,
  onConfirmAccount,
  confirmPending,
  onApprove,
  approvePending,
}: {
  needsAccountConfirm: boolean;
  showApprove: boolean;
  selectedAccountId: string | null;
  draft: ExtractedTransaction[];
  onConfirmAccount: (accountId: string) => void;
  confirmPending: boolean;
  onApprove: () => void;
  approvePending: boolean;
}) {
  const { t } = useTranslation();
  const draftHasInvalidTransaction = draft.some(
    (tx) => !tx.title.trim() || !Number.isFinite(tx.amount) || tx.amount <= 0,
  );

  if (needsAccountConfirm) {
    return (
      <Button
        type="button"
        onClick={() => onConfirmAccount(selectedAccountId as string)}
        loading={confirmPending}
        disabled={!selectedAccountId}
        className="btn btn-primary btn-sm"
      >
        {t("data.bankStatementDetail.confirmAccount")}
      </Button>
    );
  }

  if (showApprove) {
    return (
      <Button
        type="button"
        onClick={onApprove}
        loading={approvePending}
        disabled={draftHasInvalidTransaction}
        className="btn btn-primary btn-sm"
      >
        {t("data.bankStatementDetail.approve")}
      </Button>
    );
  }

  return undefined;
}
