export const BANK_ACCOUNT_LINK_TYPES = ["manual", "synced"] as const;
export type BankAccountLinkType = (typeof BANK_ACCOUNT_LINK_TYPES)[number];

/** A linked bank account, as returned by GET /accounts (BankAccountSerializer). */
export interface BankAccount {
  id: string;
  bank_name: string;
  account_type: string | null;
  /**
   * The full account number, returned exactly as stored with no display-side
   * masking — the same value whether the account was added by hand, derived
   * from a statement, or synced from the bank.
   */
  account_number: string;
  currency: string;
  is_active: boolean;
  /**
   * "synced" accounts come from a linked bank connection (auto-updated,
   * read-only) — edit/delete/manual transactions are backend-rejected for
   * them. "manual" is the pre-existing user-entered kind.
   */
  link_type: BankAccountLinkType;
  external_account_id: string | null;
  /** Derived server-side from the latest transaction's balance. DRF serializes decimals as strings. */
  current_balance: string | number;
  created_at: string;
}

export const ACCOUNT_TYPES = ["checking", "savings", "salary", "business"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const CURRENCIES = ["EGP", "SAR", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * Body for POST /accounts. `account_number` is the full account number, entered
 * twice client-side to confirm — the backend stores and returns it verbatim
 * (no masking), so a typo here is what every screen shows afterwards.
 *
 * There is deliberately no balance field: the backend derives `current_balance`
 * from the account's most recent transaction and refuses to accept it as input.
 */
export interface CreateBankAccountBody {
  bank_name: string;
  account_type: AccountType;
  currency: Currency;
  account_number: string;
}
