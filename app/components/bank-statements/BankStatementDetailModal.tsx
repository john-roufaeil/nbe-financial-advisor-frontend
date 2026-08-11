import { forwardRef, useRef, useState } from "react";
import { inferBankStatementType, BANK_STATEMENT_STATUS } from "@/types/bank-statement";
import { useAccountPreselect } from "@/lib/use-account-preselect";
import { useExtractedTransactionsDraft } from "@/lib/use-extracted-transactions-draft";
import { useBankStatementModalHeader } from "@/lib/use-bank-statement-modal-header";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { toastError } from "@/lib/toast";
import { useAccounts } from "@/queries/accounts";
import { AddBankAccountModal } from "@/components/accounts/AddBankAccountModal";
import { AccountConfirmStep } from "@/components/bank-statements/AccountConfirmStep";
import { BankStatementStatusPanel } from "@/components/bank-statements/BankStatementStatusPanel";
import { ExtractedTransactionsSection } from "@/components/bank-statements/ExtractedTransactionsSection";
import { OcrResultPanel } from "@/components/bank-statements/OcrResultPanel";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { BankStatementModalActions } from "@/components/bank-statements/BankStatementModalActions";
import {
  useBankStatement,
  useRetryBankStatement,
  useUploadBankStatements,
  useDeleteBankStatement,
  useApproveBankStatement,
} from "@/queries/bank-statements";

export const BankStatementDetailModal = forwardRef<
  HTMLDialogElement,
  { bankStatementId: string | null }
>(function BankStatementDetailModal({ bankStatementId }, ref) {
  const { data: doc } = useBankStatement(bankStatementId);
  const retryBankStatement = useRetryBankStatement();
  const uploadBankStatements = useUploadBankStatements();
  const deleteBankStatement = useDeleteBankStatement();
  const approveBankStatement = useApproveBankStatement();
  const { data: allAccounts, isLoading: accountsLoading } = useAccounts();
  // A synced account is read-only server-side (assert_account_mutable()) —
  // statement approval would write transactions onto it, so it's excluded
  // from the account a statement can be filed against, same as manual entry.
  const accounts = allAccounts?.filter((a) => a.link_type !== "synced");
  const accountModalRef = useRef<HTMLDialogElement>(null);
  const reuploadInputRef = useRef<HTMLInputElement>(null);
  const { icon, title } = useBankStatementModalHeader(doc);

  const { draft, updateDraftTransaction, deleteDraftTransaction, addDraftTransaction } =
    useExtractedTransactionsDraft(doc);

  const { selectedAccountId, setSelectedAccountId, setAwaitingNewAccount } =
    useAccountPreselect(doc, accounts);

  // Recovery for a failed *upload*: pick the file again, upload it fresh, then
  // drop the stale failed record. Processing failures use retry instead.
  async function handleReupload(oldId: string, file: File | undefined) {
    if (!file) return;
    const type = inferBankStatementType(file);
    if (!type) {
      toastError("toast.genericError");
      return;
    }
    try {
      await uploadBankStatements.mutateAsync([
        {
          name: file.name,
          type,
          sizeKb: Math.max(1, Math.round(file.size / 1024)),
          file,
        },
      ]);
      deleteBankStatement.mutate(oldId);
      reuploadInputRef.current?.closest("dialog")?.close();
    } catch {
      // uploadBankStatements' onError already surfaced a toast; keep the modal open.
    }
  }

  // Confirming the account is a CLIENT-SIDE review step: no endpoint accepts an
  // account on its own, so nothing about the statement changes server-side until
  // approve carries the chosen `accountId` along with the rows. Waiting on the
  // server to flip a flag here would leave the user stuck on step 1 forever.
  // The caller keys this component on bankStatementId, so a fresh mount is
  // what resets this (and the two hooks above) to a different statement —
  // no explicit reset effect needed here.
  const [accountConfirmed, setAccountConfirmed] = useState(false);

  const isConfirmed = !!doc && (doc.accountConfirmed || accountConfirmed);
  const needsAccountConfirm =
    !!doc && doc.status === BANK_STATEMENT_STATUS.processed && !isConfirmed;
  const showApprove = !!(
    doc &&
    doc.status === BANK_STATEMENT_STATUS.processed &&
    isConfirmed &&
    !doc.approved &&
    draft.length > 0
  );

  return (
    <>
      <BaseModal
        ref={ref}
        icon={icon}
        title={title}
        actions={
          doc && (
            <BankStatementModalActions
              needsAccountConfirm={needsAccountConfirm}
              showApprove={showApprove}
              selectedAccountId={selectedAccountId}
              draft={draft}
              onConfirmAccount={(accountId) => {
                setSelectedAccountId(accountId);
                setAccountConfirmed(true);
              }}
              onApprove={() =>
                approveBankStatement.mutate({
                  id: doc.id,
                  transactions: draft,
                  accountId: selectedAccountId ?? undefined,
                })
              }
              approvePending={approveBankStatement.isPending}
            />
          )
        }
      >
        <div className="flex flex-col gap-4">
          {doc && (
            <>
              {(doc.status === BANK_STATEMENT_STATUS.uploading ||
                doc.status === BANK_STATEMENT_STATUS.processing ||
                doc.status === BANK_STATEMENT_STATUS.failed) && (
                <BankStatementStatusPanel
                  doc={doc}
                  reuploadInputRef={reuploadInputRef}
                  onReupload={(file) => handleReupload(doc.id, file)}
                  uploadPending={uploadBankStatements.isPending}
                  deletePending={deleteBankStatement.isPending}
                  onRetry={() => retryBankStatement.mutate(doc.id)}
                  retryPending={retryBankStatement.isPending}
                />
              )}

              {doc.status === BANK_STATEMENT_STATUS.processed && (
                <OcrResultPanel statementId={doc.id} />
              )}

              {doc.status === BANK_STATEMENT_STATUS.processed && needsAccountConfirm && (
                <AccountConfirmStep
                  accounts={accounts}
                  accountsLoading={accountsLoading}
                  selectedAccountId={selectedAccountId}
                  onSelectAccount={setSelectedAccountId}
                  onAddNewAccount={() => {
                    setAwaitingNewAccount(true);
                    accountModalRef.current?.showModal();
                  }}
                />
              )}

              {doc.status === BANK_STATEMENT_STATUS.processed && !needsAccountConfirm && (
                <ErrorBoundary>
                  <ExtractedTransactionsSection
                    doc={doc}
                    draft={draft}
                    onUpdate={updateDraftTransaction}
                    onDelete={deleteDraftTransaction}
                    onAdd={addDraftTransaction}
                  />
                </ErrorBoundary>
              )}
            </>
          )}
        </div>
      </BaseModal>
      <AddBankAccountModal ref={accountModalRef} />
    </>
  );
});
