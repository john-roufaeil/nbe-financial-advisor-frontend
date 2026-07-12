import { forwardRef, useEffect, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { BankAccount } from "@/types/account";
import { useUpdateAccount } from "@/queries/accounts";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { BankBadge } from "@/components/shared/BankBadge";
import { MoneyInput } from "@/components/shared/forms/MoneyInput";
import { MAX_MONEY_VALUE } from "@/lib/format";

function closeDialog(ref: Ref<HTMLDialogElement>) {
  if (ref && typeof ref === "object" && "current" in ref) ref.current?.close();
}

interface FormValues {
  balance: number | "";
}

export const EditBankAccountModal = forwardRef<
  HTMLDialogElement,
  { account: BankAccount | null }
>(function EditBankAccountModal({ account }, ref) {
  const { t } = useTranslation();
  const updateAccount = useUpdateAccount();

  const schema = z.object({
    balance: z
      .union([z.number(), z.literal("")])
      .refine((v) => v !== "" && Number.isFinite(v) && v >= 0, {
        message: t("common.editAccount.errors.balanceInvalid"),
      }),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { balance: "" },
  });

  useEffect(() => {
    if (account) reset({ balance: Number(account.current_balance) });
  }, [account, reset]);

  async function onSubmit(values: FormValues) {
    if (!account) return;
    try {
      await updateAccount.mutateAsync({
        id: account.id,
        patch: { current_balance: String(values.balance) },
      });
      closeDialog(ref);
    } catch {
      // onError already toasted; keep the modal open with the entered value.
    }
  }

  return (
    <BaseModal
      ref={ref}
      onClose={() => account && reset({ balance: Number(account.current_balance) })}
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
            onClick={() => closeDialog(ref)}
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
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <BankBadge
            bank={account.bank_name}
            subtitle={<span dir="ltr">{account.masked_account_number}</span>}
          />
          <label className="flex flex-col gap-1">
            <span className="label-text text-xs">{t("common.editAccount.balance")}</span>
            <label
              className={`input input-bordered input-sm flex w-full items-center gap-2 ${errors.balance ? "input-error" : ""}`}
            >
              <Controller
                name="balance"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    value={field.value}
                    max={MAX_MONEY_VALUE}
                    onChange={field.onChange}
                    className="w-full"
                  />
                )}
              />
              <span className="text-base-content/50 shrink-0 text-xs">
                {t(`currency.${account.currency}`, account.currency)}
              </span>
            </label>
            {errors.balance && (
              <span className="text-error text-xs">{errors.balance.message}</span>
            )}
          </label>
        </form>
      )}
    </BaseModal>
  );
});
