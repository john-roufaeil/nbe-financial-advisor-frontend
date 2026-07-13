import { useTranslation } from "react-i18next";
import {
  ACCOUNT_TYPES,
  CURRENCIES,
  type AccountType,
  type Currency,
} from "@/types/account";
import { BankPicker } from "@/components/shared/BankPicker";
import {
  ACCOUNT_NUMBER_LENGTH,
  confirmMismatchError,
  type BankAccountFormErrors,
  type BankAccountFormValues,
} from "@/lib/bank-account-form";

/** Shared bank-account form fields, used both by the standalone AddBankAccountModal and inline in the statement-review flow's "add a new account" step. */
export function BankAccountFields({
  values,
  errors,
  onChange,
  onErrorsChange,
}: {
  values: BankAccountFormValues;
  errors: BankAccountFormErrors;
  onChange: (patch: Partial<BankAccountFormValues>) => void;
  onErrorsChange: (patch: Partial<BankAccountFormErrors>) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="label-text text-xs">{t("common.addAccount.accountType")}</span>
          <select
            value={values.accountType}
            onChange={(e) => onChange({ accountType: e.target.value as AccountType })}
            className="select select-bordered select-sm w-full"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`common.addAccount.accountTypes.${type}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1">
          <span className="label-text text-xs">{t("common.addAccount.currency")}</span>
          <select
            value={values.currency}
            onChange={(e) => onChange({ currency: e.target.value as Currency })}
            className="select select-bordered select-sm w-full"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {t(`currency.${currency}`, currency)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("common.addAccount.bank")}</span>
        <BankPicker
          value={values.bankName}
          onChange={(name) => {
            onChange({ bankName: name });
            if (errors.bankName) onErrorsChange({ bankName: undefined });
          }}
        />
        {errors.bankName && <span className="text-error text-xs">{errors.bankName}</span>}
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">{t("common.addAccount.accountNumber")}</span>
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={values.accountNumber}
          onChange={(e) => {
            const digits = e.target.value
              .replace(/\D/g, "")
              .slice(0, ACCOUNT_NUMBER_LENGTH);
            onChange({ accountNumber: digits });
            onErrorsChange({
              accountNumber: undefined,
              accountNumberConfirm: confirmMismatchError(
                digits,
                values.accountNumberConfirm,
                t,
              ),
            });
          }}
          placeholder={t("common.addAccount.accountNumberPlaceholder")}
          maxLength={ACCOUNT_NUMBER_LENGTH}
          className={`input input-bordered input-sm w-full ${errors.accountNumber ? "input-error" : ""}`}
        />
        {errors.accountNumber && (
          <span className="text-error text-xs">{errors.accountNumber}</span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="label-text text-xs">
          {t("common.addAccount.accountNumberConfirm")}
        </span>
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={values.accountNumberConfirm}
          onChange={(e) => {
            const digits = e.target.value
              .replace(/\D/g, "")
              .slice(0, ACCOUNT_NUMBER_LENGTH);
            onChange({ accountNumberConfirm: digits });
            onErrorsChange({
              accountNumberConfirm: confirmMismatchError(values.accountNumber, digits, t),
            });
          }}
          placeholder={t("common.addAccount.accountNumberPlaceholder")}
          maxLength={ACCOUNT_NUMBER_LENGTH}
          className={`input input-bordered input-sm w-full ${errors.accountNumberConfirm ? "input-error" : ""}`}
        />
        {errors.accountNumberConfirm && (
          <span className="text-error text-xs">{errors.accountNumberConfirm}</span>
        )}
      </label>
    </div>
  );
}
