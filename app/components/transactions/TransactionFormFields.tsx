import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AccountPicker } from "@/components/transactions/AccountPicker";
import { TypeCategoryField } from "@/components/transactions/TypeCategoryField";
import { MoneyInput } from "@/components/shared/forms/MoneyInput";
import { MAX_MONEY_VALUE } from "@/lib/format";
import type { TransactionFormValues } from "@/lib/use-transaction-form";
import type { BankAccount } from "@/types/account";

export function TransactionFormFields({
  formId,
  onSubmit,
  control,
  register,
  setValue,
  errors,
  accounts,
  editing,
  currencyLabel,
  onAddNewAccount,
  today,
  minDate,
}: {
  formId: string;
  onSubmit: () => void;
  control: Control<TransactionFormValues>;
  register: UseFormRegister<TransactionFormValues>;
  setValue: UseFormSetValue<TransactionFormValues>;
  errors: FieldErrors<TransactionFormValues>;
  accounts: BankAccount[] | undefined;
  editing: boolean;
  currencyLabel: string;
  onAddNewAccount: () => void;
  today: () => string;
  minDate: () => string;
}) {
  const { t } = useTranslation();
  const type = useWatch({ control, name: "type" });
  const category = useWatch({ control, name: "category" });

  return (
    <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("transactions.add.name")}</span>
        <input
          type="text"
          placeholder={t("transactions.add.namePlaceholder")}
          maxLength={20}
          className={`input input-bordered input-sm w-full ${errors.title ? "input-error" : ""}`}
          {...register("title")}
        />
        {errors.title && (
          <span className="text-error text-xs">{errors.title.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("transactions.add.account")}</span>
        <Controller
          name="accountId"
          control={control}
          render={({ field }) => (
            <AccountPicker
              accounts={accounts}
              value={field.value}
              onChange={field.onChange}
              onAddNew={onAddNewAccount}
              disabled={editing}
              placeholder={t("transactions.add.accountPlaceholder")}
              error={!!errors.accountId}
            />
          )}
        />
        {errors.accountId && (
          <span className="text-error text-xs">{errors.accountId.message}</span>
        )}
        {!editing && accounts && accounts.length === 0 && (
          <span className="text-base-content/50 text-xs">
            {t("transactions.add.noAccounts")}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("transactions.add.amount")}</span>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <MoneyInput
              value={field.value}
              max={MAX_MONEY_VALUE}
              onChange={field.onChange}
              placeholder={t("transactions.add.amountPlaceholder")}
              unit={currencyLabel}
              aria-label={t("transactions.add.amount")}
              className={`w-full ${errors.amount ? "input-error" : ""}`}
            />
          )}
        />
        {errors.amount && (
          <span className="text-error text-xs">{errors.amount.message}</span>
        )}
      </label>

      <div className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("transactions.add.category")}</span>
        <TypeCategoryField
          type={type}
          category={category}
          onTypeChange={(next, fallback) => {
            setValue("type", next, { shouldValidate: true });
            if (fallback) setValue("category", fallback, { shouldValidate: true });
          }}
          onCategoryChange={(c) => setValue("category", c, { shouldValidate: true })}
        />
      </div>

      <label className="flex w-full flex-col gap-1">
        <span className="label-text text-xs">{t("transactions.add.date")}</span>
        <input
          type="date"
          min={minDate()}
          max={today()}
          className="input input-bordered input-sm w-full"
          {...register("date")}
        />
      </label>
    </form>
  );
}
