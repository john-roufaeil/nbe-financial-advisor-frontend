import {
  ACCOUNT_TYPES,
  CURRENCIES,
  type AccountType,
  type Currency,
} from "@/types/account";

export const ACCOUNT_NUMBER_LENGTH = 4;

export interface BankAccountFormValues {
  accountType: AccountType;
  bankName: string;
  currency: Currency;
  accountNumber: string;
  accountNumberConfirm: string;
}

export interface BankAccountFormErrors {
  bankName?: string;
  accountNumber?: string;
  accountNumberConfirm?: string;
}

export function emptyBankAccountForm(): BankAccountFormValues {
  return {
    accountType: ACCOUNT_TYPES[0],
    bankName: "",
    currency: CURRENCIES[0],
    accountNumber: "",
    accountNumberConfirm: "",
  };
}

export function validateBankAccountForm(
  values: BankAccountFormValues,
  t: (key: string) => string,
): BankAccountFormErrors {
  const errors: BankAccountFormErrors = {};
  const isDigits = (v: string) => /^\d+$/.test(v);

  if (!values.bankName.trim()) {
    errors.bankName = t("common.addAccount.errors.bankRequired");
  }
  if (
    !isDigits(values.accountNumber) ||
    values.accountNumber.length !== ACCOUNT_NUMBER_LENGTH
  ) {
    errors.accountNumber = t("common.addAccount.errors.accountNumberInvalid");
  } else if (values.accountNumber !== values.accountNumberConfirm) {
    errors.accountNumberConfirm = t("common.addAccount.errors.accountNumberMismatch");
  }
  return errors;
}

export function confirmMismatchError(
  number: string,
  confirm: string,
  t: (key: string) => string,
): string | undefined {
  if (!confirm || confirm.length !== ACCOUNT_NUMBER_LENGTH) return undefined;
  return number === confirm
    ? undefined
    : t("common.addAccount.errors.accountNumberMismatch");
}

export function isBankAccountFormValid(values: BankAccountFormValues): boolean {
  const isDigits = (v: string) => /^\d+$/.test(v);
  return (
    values.bankName.trim().length > 0 &&
    isDigits(values.accountNumber) &&
    values.accountNumber.length === ACCOUNT_NUMBER_LENGTH &&
    values.accountNumber === values.accountNumberConfirm
  );
}
