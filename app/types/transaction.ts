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
  "Housing",
  "Rent",
  "Groceries",
  "Entertainment",
  "Utilities",
  "Food",
  "Transportation",
  "Savings",
  "Lifestyle",
  "Other",
] as const;

/**
 * Income has its own category vocabulary — these are NOT budget buckets like
 * TRANSACTION_CATEGORIES above (income doesn't consume a spending allocation),
 * so they aren't matched against the plan's categories server-side today.
 * TODO(backend): the backend needs to recognize these values — as of now an
 * income transaction's category is stored but not matched to anything.
 */
export const INCOME_CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "gift",
  "other_income",
] as const;

export function categoriesForType(type: "income" | "expense"): readonly string[] {
  return type === "income" ? INCOME_CATEGORIES : TRANSACTION_CATEGORIES;
}

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
