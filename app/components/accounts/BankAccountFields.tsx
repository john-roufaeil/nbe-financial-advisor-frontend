import { useTranslation } from "react-i18next";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  type AccountType,
  type Currency,
} from "@/types/account";
import { BankPicker } from "@/components/shared/forms/BankPicker";
import {
  ACCOUNT_NUMBER_LENGTH,
  type BankAccountFormValues,
} from "@/lib/bank-account-form";

/** Shared bank-account form fields, used both by the standalone AddBankAccountModal and inline in the statement-review flow's "add a new account" step. */
export function BankAccountFields({
  control,
  errors,
}: {
  control: Control<BankAccountFormValues>;
  errors: FieldErrors<BankAccountFormValues>;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="label-text text-xs">{t("common.addAccount.accountType")}</span>
          <Controller
            name="accountType"
            control={control}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value as AccountType)}
                className="select select-bordered select-sm w-full"
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`common.addAccount.accountTypes.${type}`)}
                  </option>
                ))}
              </select>
            )}
          />
        </label>

        <label className="flex flex-1 flex-col gap-1">
          <span className="label-text text-xs">{t("common.addAccount.currency")}</span>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value as Currency)}
                className="select select-bordered select-sm w-full"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {t(`currency.${currency}`, currency)}
                  </option>
                ))}
              </select>
            )}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("common.addAccount.bank")}</span>
        <Controller
          name="bankName"
          control={control}
          render={({ field }) => (
            <BankPicker value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.bankName && (
          <span className="text-error text-xs">{errors.bankName.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("common.addAccount.accountNumber")}</span>
        <Controller
          name="accountNumber"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={field.value}
              onChange={(e) =>
                field.onChange(
                  e.target.value.replace(/\D/g, "").slice(0, ACCOUNT_NUMBER_LENGTH),
                )
              }
              placeholder={t("common.addAccount.accountNumberPlaceholder")}
              maxLength={ACCOUNT_NUMBER_LENGTH}
              className={`input input-bordered input-sm w-full ${errors.accountNumber ? "input-error" : ""}`}
            />
          )}
        />
        {errors.accountNumber && (
          <span className="text-error text-xs">{errors.accountNumber.message}</span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("common.addAccount.accountNumberConfirm")}
        </span>
        <Controller
          name="accountNumberConfirm"
          control={control}
          render={({ field }) => (
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={field.value}
              onChange={(e) =>
                field.onChange(
                  e.target.value.replace(/\D/g, "").slice(0, ACCOUNT_NUMBER_LENGTH),
                )
              }
              placeholder={t("common.addAccount.accountNumberPlaceholder")}
              maxLength={ACCOUNT_NUMBER_LENGTH}
              className={`input input-bordered input-sm w-full ${errors.accountNumberConfirm ? "input-error" : ""}`}
            />
          )}
        />
        {errors.accountNumberConfirm && (
          <span className="text-error text-xs">
            {errors.accountNumberConfirm.message}
          </span>
        )}
      </label>
    </div>
  );
}
