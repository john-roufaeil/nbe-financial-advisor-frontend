export interface Transaction {
  id: string;
  datetime: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  /** The linked bank account this transaction belongs to. Not patchable once created. */
  accountId?: string;
  /** Where the backend got this row from, e.g. "manual" or "synchronized". Synced
   * transactions are backend-rejected on edit/delete — see TransactionCard. */
  source: string;
}

// The category vocabulary is NOT hardcoded here — it's the backend's
// taxonomy, fetched once per session via GET /categories (see
// app/queries/categories.ts). The backend matches a transaction to its budget
// bucket by EXACT string equality on Category.name, so only fetched names are
// ever stored.

export interface AmountRange {
  key: string;
  min?: number;
  max?: number;
}

/** Preset amount buckets for the amount-range filter — bounds are EGP. */
export const AMOUNT_RANGES: readonly AmountRange[] = [
  { key: "any" },
  { key: "under500", max: 500 },
  { key: "500to1000", min: 500, max: 1000 },
  { key: "1000to5000", min: 1000, max: 5000 },
  { key: "over5000", min: 5000 },
] as const;
