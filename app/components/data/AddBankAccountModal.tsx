import { forwardRef, type Ref, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateAccount } from "@/queries/accounts";
import { getBankCode } from "@/lib/banks";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/BaseModal";
import { BankAccountFields } from "@/components/data/BankAccountFields";
import {
  emptyBankAccountForm,
  isBankAccountFormValid,
  validateBankAccountForm,
  type BankAccountFormErrors,
} from "@/lib/bank-account-form";

function closeDialog(ref: Ref<HTMLDialogElement>) {
  if (ref && typeof ref === "object" && "current" in ref) ref.current?.close();
}

export const AddBankAccountModal = forwardRef<HTMLDialogElement>(
  function AddBankAccountModal(_props, ref) {
    const { t } = useTranslation();
    const createAccount = useCreateAccount();

    const [values, setValues] = useState(emptyBankAccountForm());
    const [errors, setErrors] = useState<BankAccountFormErrors>({});

    function reset() {
      setValues(emptyBankAccountForm());
      setErrors({});
    }

    const isValid = isBankAccountFormValid(values);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      const nextErrors = validateBankAccountForm(values, t);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      const trimmedBankName = values.bankName.trim();
      try {
        await createAccount.mutateAsync({
          // Backend expects the short bank code (e.g. "NBE"); fall back to the
          // raw name for banks the user added that aren't in our registry.
          bank_name: getBankCode(trimmedBankName) ?? trimmedBankName,
          account_type: values.accountType,
          currency: values.currency,
          account_number: values.accountNumber,
          initial_balance: values.initialBalance,
        });
        reset();
        closeDialog(ref);
      } catch {
        // onError already toasted; keep the modal open with the entered values.
      }
    }

    return (
      <BaseModal
        ref={ref}
        onClose={reset}
        title={t("data.addAccount.title")}
        actions={
          <>
            <Button
              type="submit"
              form="add-account-form"
              loading={createAccount.isPending}
              disabled={!isValid}
              className="btn btn-primary"
            >
              {t("data.addAccount.add")}
            </Button>
            <button
              type="button"
              onClick={() => {
                reset();
                closeDialog(ref);
              }}
              className="btn btn-ghost"
            >
              {t("actions.cancel")}
            </button>
          </>
        }
      >
        <form
          id="add-account-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
        >
          <BankAccountFields
            values={values}
            errors={errors}
            onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
            onErrorsChange={(patch) => setErrors((err) => ({ ...err, ...patch }))}
          />
        </form>
      </BaseModal>
    );
  },
);
