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
  initialBalance: number | "";
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
