import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import type { Transaction } from "@/types/transaction";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { AddBankAccountModal } from "@/components/accounts/AddBankAccountModal";
import { TransactionFormFields } from "@/components/transactions/TransactionFormFields";
import { useTransactionForm } from "@/lib/use-transaction-form";

export const AddTransactionModal = forwardRef<
  HTMLDialogElement,
  { editing?: Transaction | null }
>(function AddTransactionModal({ editing }, ref) {
  const { t } = useTranslation();
  const {
    control,
    setValue,
    errors,
    isValid,
    accounts,
    accountModalRef,
    currencyLabel,
    isSaving,
    isSyncedEditing,
    resetForm,
    handleAddNewAccount,
    handleFormSubmit,
    today,
    minDate,
    closeDialog,
  } = useTransactionForm(editing, ref);

  return (
    <>
      <BaseModal
        ref={ref}
        onClose={resetForm}
        title={editing ? t("transactions.add.editTitle") : t("transactions.add.title")}
        actions={
          <>
            <Button
              type="submit"
              form="add-transaction-form"
              loading={isSaving}
              disabled={!isValid}
              className="btn btn-primary"
            >
              {editing ? t("actions.done") : t("transactions.add.add")}
            </Button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                closeDialog();
              }}
              className="btn btn-ghost"
            >
              {t("actions.cancel")}
            </button>
          </>
        }
      >
        <TransactionFormFields
          formId="add-transaction-form"
          onSubmit={handleFormSubmit}
          control={control}
          setValue={setValue}
          errors={errors}
          accounts={accounts}
          editing={!!editing}
          isSyncedEditing={isSyncedEditing}
          currencyLabel={currencyLabel}
          onAddNewAccount={handleAddNewAccount}
          today={today}
          minDate={minDate}
        />
      </BaseModal>
      <AddBankAccountModal ref={accountModalRef} />
    </>
  );
});
