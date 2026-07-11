import {
  ACCOUNT_TYPES,
  CURRENCIES,
  type AccountType,
  type Currency,
} from "@/types/account";

export const ACCOUNT_NUMBER_LENGTH = 8;

export interface BankAccountFormValues {
  accountType: AccountType;
  bankName: string;
  currency: Currency;
  accountNumber: string;
  accountNumberConfirm: string;
  initialBalance: string;
}

export interface BankAccountFormErrors {
  bankName?: string;
  accountNumber?: string;
  accountNumberConfirm?: string;
  initialBalance?: string;
}

export function emptyBankAccountForm(): BankAccountFormValues {
  return {
    accountType: ACCOUNT_TYPES[0],
    bankName: "",
    currency: CURRENCIES[0],
    accountNumber: "",
    accountNumberConfirm: "",
    initialBalance: "",
  };
}

export function validateBankAccountForm(
  values: BankAccountFormValues,
  t: (key: string) => string,
): BankAccountFormErrors {
  const errors: BankAccountFormErrors = {};
  const isDigits = (v: string) => /^\d+$/.test(v);
  const balanceNum = Number(values.initialBalance);

  if (!values.bankName.trim()) {
    errors.bankName = t("data.addAccount.errors.bankRequired");
  }
  if (
    !isDigits(values.accountNumber) ||
    values.accountNumber.length !== ACCOUNT_NUMBER_LENGTH
  ) {
    errors.accountNumber = t("data.addAccount.errors.accountNumberInvalid");
  } else if (values.accountNumber !== values.accountNumberConfirm) {
    errors.accountNumberConfirm = t("data.addAccount.errors.accountNumberMismatch");
  }
  if (!values.initialBalance || !Number.isFinite(balanceNum) || balanceNum < 0) {
    errors.initialBalance = t("data.addAccount.errors.balanceInvalid");
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
    : t("data.addAccount.errors.accountNumberMismatch");
}

export function balanceError(
  value: string,
  t: (key: string) => string,
): string | undefined {
  if (value === "") return undefined;
  const num = Number(value);
  return !Number.isFinite(num) || num < 0
    ? t("data.addAccount.errors.balanceInvalid")
    : undefined;
}

export function isBankAccountFormValid(values: BankAccountFormValues): boolean {
  const balanceNum = Number(values.initialBalance);
  const isDigits = (v: string) => /^\d+$/.test(v);
  return (
    values.bankName.trim().length > 0 &&
    isDigits(values.accountNumber) &&
    values.accountNumber.length === ACCOUNT_NUMBER_LENGTH &&
    values.accountNumber === values.accountNumberConfirm &&
    values.initialBalance !== "" &&
    Number.isFinite(balanceNum) &&
    balanceNum >= 0
  );
}
