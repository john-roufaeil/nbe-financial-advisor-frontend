export interface Transaction {
  id: string;
  datetime: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  /** The linked bank account this transaction belongs to. Not patchable once created. */
  accountId?: string;
  /** Where the backend got this row from — one of TRANSACTION_SOURCES. Synced
   * transactions are backend-rejected on edit/delete — see TransactionCard. */
  source: string;
}

// The category vocabulary is NOT hardcoded here — it's the backend's
// taxonomy, fetched once per session via GET /categories (see
// app/queries/categories.ts). The backend matches a transaction to its budget
// bucket by EXACT string equality on Category.name, so only fetched names are
// ever stored.

/** Mirrors the backend's TRANSACTION_SOURCES (core/constants.py). */
export const TRANSACTION_SOURCES = ["statement", "manual", "synced"] as const;
export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];
