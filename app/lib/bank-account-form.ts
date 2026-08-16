import {
  ACCOUNT_TYPES,
  CURRENCIES,
  type AccountType,
  type Currency,
} from "@/types/account";

/**
 * Full account numbers, not the last 4 — the backend stores and returns
 * `account_number` verbatim (BankAccountSerializer does no masking), so
 * what's typed here is what every screen displays and what
 * `?account_number=` dedup matches against.
 *
 * A range rather than an exact width: Egyptian account numbers aren't uniform
 * across banks. 34 is the ISO 13616 IBAN ceiling, a safe upper bound for any
 * account identifier and comfortably under the backend column's 50; 8 is a low
 * floor that still rejects someone entering only the last 4 out of habit.
 */
export const ACCOUNT_NUMBER_MIN_LENGTH = 8;
export const ACCOUNT_NUMBER_MAX_LENGTH = 34;

export interface BankAccountFormValues {
  accountType: AccountType;
  bankName: string;
  currency: Currency;
  accountNumber: string;
  accountNumberConfirm: string;
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
