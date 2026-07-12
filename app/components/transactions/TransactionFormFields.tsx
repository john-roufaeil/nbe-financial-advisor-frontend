import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TRANSACTION_CATEGORIES } from "@/types/transaction";
import { AccountPicker } from "@/components/transactions/AccountPicker";
import { MoneyInput } from "@/components/shared/forms/MoneyInput";
import { MAX_MONEY_VALUE } from "@/lib/format";
import type { TransactionFormValues } from "@/lib/use-transaction-form";
import type { BankAccount } from "@/types/account";

export function TransactionFormFields({
  formId,
  onSubmit,
  control,
  register,
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
  errors: FieldErrors<TransactionFormValues>;
  accounts: BankAccount[] | undefined;
  editing: boolean;
  currencyLabel: string;
  onAddNewAccount: () => void;
  today: () => string;
  minDate: () => string;
}) {
  const { t } = useTranslation();

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
        <span className="label-text text-xs">{t("transactions.add.category")}</span>
        <select
          className="select select-bordered select-sm w-full"
          {...register("category")}
        >
          {TRANSACTION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`common.categories.${c}`, c)}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="label-text text-xs">{t("transactions.add.amount")}</span>
          <label
            className={`input input-bordered input-sm flex w-full items-center gap-2 ${errors.amount ? "input-error" : ""}`}
          >
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  value={field.value}
                  max={MAX_MONEY_VALUE}
                  onChange={field.onChange}
                  placeholder={t("transactions.add.amountPlaceholder")}
                  className="w-full"
                />
              )}
            />
            <span className="text-base-content/50 shrink-0 text-xs">{currencyLabel}</span>
          </label>
          {errors.amount && (
            <span className="text-error text-xs">{errors.amount.message}</span>
          )}
        </label>
        <div className="flex flex-col gap-1">
          <span className="label-text text-xs">&nbsp;</span>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="join border-base-300 w-fit rounded-lg border">
                <button
                  type="button"
                  onClick={() => field.onChange("expense")}
                  className={`btn btn-sm join-item cursor-pointer ${field.value === "expense" ? "btn-error" : "btn-ghost"}`}
                >
                  {t("common.filters.expense")}
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange("income")}
                  className={`btn btn-sm join-item cursor-pointer ${field.value === "income" ? "btn-success" : "btn-ghost"}`}
                >
                  {t("common.filters.income")}
                </button>
              </div>
            )}
          />
        </div>
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
