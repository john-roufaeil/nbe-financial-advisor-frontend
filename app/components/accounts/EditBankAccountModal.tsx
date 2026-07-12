import { forwardRef, useEffect, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import type { BankAccount } from "@/types/account";
import { useUpdateAccount } from "@/queries/accounts";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/BaseModal";
import { BankBadge } from "@/components/shared/BankBadge";
import { MoneyInput } from "@/components/shared/MoneyInput";
import { MAX_MONEY_VALUE } from "@/lib/format";

function closeDialog(ref: Ref<HTMLDialogElement>) {
  if (ref && typeof ref === "object" && "current" in ref) ref.current?.close();
}

export const EditBankAccountModal = forwardRef<
  HTMLDialogElement,
  { account: BankAccount | null }
>(function EditBankAccountModal({ account }, ref) {
  const { t } = useTranslation();
  const updateAccount = useUpdateAccount();
  const [balance, setBalance] = useState<number | "">("");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (account) setBalance(Number(account.current_balance));
  }, [account]);

  function reset() {
    setError(undefined);
  }

  const balanceNum = balance === "" ? NaN : balance;
  const isValid = balance !== "" && Number.isFinite(balanceNum) && balanceNum >= 0;

  function balanceError(value: number | ""): string | undefined {
    if (value === "") return undefined;
    return !Number.isFinite(value) || value < 0
      ? t("common.editAccount.errors.balanceInvalid")
      : undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account) return;
    if (!balance || !Number.isFinite(balanceNum) || balanceNum < 0) {
      setError(t("common.editAccount.errors.balanceInvalid"));
      return;
    }
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        patch: { current_balance: String(balanceNum) },
      });
      reset();
      closeDialog(ref);
    } catch {
      // onError already toasted; keep the modal open with the entered value.
    }
  }

  return (
    <BaseModal
      ref={ref}
      onClose={reset}
      title={t("common.editAccount.title")}
      actions={
        <>
          <Button
            type="submit"
            form="edit-account-form"
            loading={updateAccount.isPending}
            disabled={!isValid}
            className="btn btn-primary"
          >
            {t("actions.done")}
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
      {account && (
        <form
          id="edit-account-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
        >
          <BankBadge
            bank={account.bank_name}
            subtitle={<span dir="ltr">{account.masked_account_number}</span>}
          />
          <label className="flex flex-col gap-1">
            <span className="label-text text-xs">{t("common.editAccount.balance")}</span>
            <label
              className={`input input-bordered input-sm flex w-full items-center gap-2 ${error ? "input-error" : ""}`}
            >
              <MoneyInput
                value={balance}
                max={MAX_MONEY_VALUE}
                onChange={(value) => {
                  setBalance(value);
                  setError(balanceError(value));
                }}
                className="w-full"
              />
              <span className="text-base-content/50 shrink-0 text-xs">
                {t(`currency.${account.currency}`, account.currency)}
              </span>
            </label>
            {error && <span className="text-error text-xs">{error}</span>}
          </label>
        </form>
      )}
    </BaseModal>
  );
});
