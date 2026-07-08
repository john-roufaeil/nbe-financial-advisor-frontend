export interface Transaction {
  id: string;
  datetime: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
}

export const TRANSACTION_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Utilities",
  "Shopping",
  "Health",
  "Income",
] as const;
