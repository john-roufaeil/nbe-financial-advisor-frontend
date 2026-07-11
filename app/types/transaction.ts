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

export const TRANSACTION_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Utilities",
  "Shopping",
  "Health",
  "Income",
  "Rent",
  "Savings",
  "Transportation",
  "Entertainment",
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
