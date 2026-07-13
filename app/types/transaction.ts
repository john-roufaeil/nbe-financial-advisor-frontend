export interface Transaction {
  id: string;
  datetime: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  /** The linked bank account this transaction belongs to. Not patchable once created. */
  accountId?: string;
}

/**
 * The one canonical category vocabulary, shared with the budget.
 *
 * These are exactly the six buckets every starter template allocates across, and
 * the backend matches a transaction to its budget bucket by EXACT string equality
 * on this value. Any category outside this list — or merely differing in case —
 * silently contributes to no bucket, so the plan reports 0% used while the money
 * is really gone. Display names live in i18n (common.categories.*); only these
 * six values are ever stored.
 */
export const TRANSACTION_CATEGORIES = [
  "housing",
  "food",
  "transport",
  "savings",
  "lifestyle",
  "other",
] as const;

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
