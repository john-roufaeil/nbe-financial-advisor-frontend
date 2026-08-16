import type { ChatToolCall } from "@/types/chat";

export interface SpendingCategory {
  name: string;
  amount: number;
  pct: number;
}

export interface SpendingBreakdownResult {
  currency: string;
  month: string;
  total: number;
  categories: SpendingCategory[];
}

// The backend's six expense buckets (see GET /categories) — the chat tool renders these
// through common.categories.*, so anything else would show a raw key to the user.
const CATEGORY_NAMES = ["housing", "food", "transport", "savings", "lifestyle", "other"];

/**
 * Placeholder generator — no backend connected yet. Produces a deterministic-looking
 * spending breakdown so the tool UI has something realistic to render.
 */
export function buildSpendingBreakdown(): ChatToolCall {
  const raw = CATEGORY_NAMES.map((name) => ({
    name,
    amount: Math.round(200 + Math.random() * 2200),
  }));
  const total = raw.reduce((sum, c) => sum + c.amount, 0);
  // "other" always trails the rest, matching every other category list in
  // the app — it's the catch-all bucket, not one ranked by amount.
  const categories: SpendingCategory[] = raw
    .map((c) => ({ ...c, pct: Math.round((c.amount / total) * 100) }))
    .sort((a, b) => {
      if (a.name === "other") return 1;
      if (b.name === "other") return -1;
      return b.amount - a.amount;
    });

  const result: SpendingBreakdownResult = {
    currency: "EGP",
    month: "This month",
    total,
    categories,
  };

  return { toolName: "spending_breakdown", args: { period: "current_month" }, result };
}

const SPENDING_TRIGGERS = [
  "spend",
  "spent",
  "budget",
  "expense",
  "breakdown",
  "category",
  "categories",
  "where",
  "مصروف",
  "مصروفاتي",
  "ميزانية",
  "إنفاق",
  "الفئات",
];

export function wantsSpendingBreakdown(text: string): boolean {
  const lower = text.toLowerCase();
  return SPENDING_TRIGGERS.some((t) => lower.includes(t));
}

export interface ChatTransaction {
  id: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  date: string;
}

export interface TransactionsListResult {
  currency: string;
  transactions: ChatTransaction[];
}

const RECENT_TRANSACTION_POOL: Omit<ChatTransaction, "id">[] = [
  {
    title: "Carrefour Market",
    category: "food",
    type: "expense",
    amount: 650,
    date: "2026-07-08",
  },
  {
    title: "Salary deposit",
    category: "other",
    type: "income",
    amount: 42000,
    date: "2026-07-01",
  },
  {
    title: "Uber ride",
    category: "transport",
    type: "expense",
    amount: 120,
    date: "2026-07-06",
  },
  {
    title: "Netflix subscription",
    category: "lifestyle",
    type: "expense",
    amount: 150,
    date: "2026-07-05",
  },
  {
    title: "Cairo Kitchen restaurant",
    category: "food",
    type: "expense",
    amount: 380,
    date: "2026-07-04",
  },
];

export function buildTransactionsList(): ChatToolCall {
  const result: TransactionsListResult = {
    currency: "EGP",
    transactions: RECENT_TRANSACTION_POOL.map((tx) => ({
      ...tx,
      id: crypto.randomUUID(),
    })),
  };
  return { toolName: "transactions_list", args: { period: "recent" }, result };
}

const TRANSACTIONS_TRIGGERS = [
  "recent",
  "transaction",
  "transactions",
  "history",
  "purchases",
  "last",
  "معامل",
  "معاملات",
  "الأخيرة",
  "مشترياتي",
];

export function wantsTransactions(text: string): boolean {
  const lower = text.toLowerCase();
  return TRANSACTIONS_TRIGGERS.some((t) => lower.includes(t));
}

export interface SavingsSliderResult {
  currency: string;
  current_balance: number;
  default_monthly_savings: number;
}

export function buildSavingsSlider(): ChatToolCall {
  const result: SavingsSliderResult = {
    currency: "EGP",
    current_balance: 128450,
    default_monthly_savings: 3000,
  };
  return { toolName: "savings_slider", args: { horizonMonths: 12 }, result };
}

const SAVINGS_TRIGGERS = ["save", "saving", "savings", "ادخار", "أوفر", "توفير"];

export function wantsSavingsPlan(text: string): boolean {
  const lower = text.toLowerCase();
  return SAVINGS_TRIGGERS.some((t) => lower.includes(t));
}

const SUGGESTIONS_BY_TOOL: Record<string, string[]> = {
  spending_breakdown: [
    "Which category grew the most this month?",
    "How can I cut down on dining expenses?",
    "Compare this to last month",
  ],
  transactions_list: [
    "Show only my expenses",
    "What's my biggest purchase this month?",
    "Any subscriptions I forgot about?",
  ],
  savings_slider: [
    "What if I save 20% more each month?",
    "How does this affect my emergency fund?",
    "Set this as my new savings goal",
  ],
  allocation_slider: [
    "Why this split?",
    "Suggest a more aggressive savings split",
    "Revert to my last confirmed allocation",
  ],
  default: [
    "Show my spending breakdown",
    "What are my recent transactions?",
    "Help me plan my savings",
  ],
};

export function buildSuggestions(toolName?: string): string[] {
  return SUGGESTIONS_BY_TOOL[toolName ?? "default"] ?? SUGGESTIONS_BY_TOOL.default;
}
