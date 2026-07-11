/** A linked bank account, as returned by GET /accounts (BankAccountSerializer). */
export interface BankAccount {
  id: string;
  bank_name: string;
  account_type: string | null;
  masked_account_number: string;
  currency: string;
  is_active: boolean;
  /** Derived server-side from the latest transaction's balance. DRF serializes decimals as strings. */
  current_balance: string | number;
  created_at: string;
}
