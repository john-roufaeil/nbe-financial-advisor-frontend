import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAccount } from "@/queries/accounts";
import { getBankCode } from "@/lib/banks";
import { ACCOUNT_TYPES, CURRENCIES } from "@/types/account";
import { Button } from "@/components/shared/Button";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { BankAccountFields } from "@/components/accounts/BankAccountFields";
import {
  ACCOUNT_NUMBER_LENGTH,
  emptyBankAccountForm,
  type BankAccountFormValues,
} from "@/lib/bank-account-form";
import { closeDialog } from "@/lib/close-dialog";

export const AddBankAccountModal = forwardRef<HTMLDialogElement>(
  function AddBankAccountModal(_props, ref) {
    const { t } = useTranslation();
    const createAccount = useCreateAccount();

    const schema = z
      .object({
        accountType: z.enum(ACCOUNT_TYPES),
        bankName: z.string().trim().min(1, t("common.addAccount.errors.bankRequired")),
        currency: z.enum(CURRENCIES),
        accountNumber: z
          .string()
          .regex(
            new RegExp(`^\\d{${ACCOUNT_NUMBER_LENGTH}}$`),
            t("common.addAccount.errors.accountNumberInvalid"),
          ),
        accountNumberConfirm: z.string(),
      })
      .superRefine((values, ctx) => {
        if (
          /^\d+$/.test(values.accountNumber) &&
          values.accountNumber.length === ACCOUNT_NUMBER_LENGTH &&
          values.accountNumber !== values.accountNumberConfirm
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["accountNumberConfirm"],
            message: t("common.addAccount.errors.accountNumberMismatch"),
          });
        }
      });

    const {
      control,
      handleSubmit,
      reset,
      formState: { errors, isValid },
    } = useForm<BankAccountFormValues>({
      resolver: zodResolver(schema),
      mode: "onChange",
      defaultValues: emptyBankAccountForm(),
    });

    function resetForm() {
      reset(emptyBankAccountForm());
    }

    async function onSubmit(values: BankAccountFormValues) {
      const trimmedBankName = values.bankName.trim();
      try {
        await createAccount.mutateAsync({
          // Backend expects the short bank code (e.g. "NBE"); fall back to the
          // raw name for banks the user added that aren't in our registry.
          bank_name: getBankCode(trimmedBankName) ?? trimmedBankName,
          account_type: values.accountType,
          currency: values.currency,
          account_number: values.accountNumber,
        });
        resetForm();
        closeDialog(ref);
      } catch {
        // onError already toasted; keep the modal open with the entered values.
      }
    }

    return (
      <BaseModal
        ref={ref}
        onClose={resetForm}
        title={t("common.addAccount.title")}
        actions={
          <>
            <Button
              type="submit"
              form="add-account-form"
              loading={createAccount.isPending}
              disabled={!isValid}
              className="btn btn-primary"
            >
              {t("common.addAccount.add")}
            </Button>
            <button
              type="button"
              onClick={() => {
                resetForm();
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
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
        >
          <BankAccountFields control={control} errors={errors} />
        </form>
      </BaseModal>
    );
  },
);
