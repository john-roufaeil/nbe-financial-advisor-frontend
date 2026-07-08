import type { ChatToolCall } from "@/store/use-chat-store";

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

const CATEGORY_NAMES = [
  "Groceries",
  "Dining",
  "Transport",
  "Utilities",
  "Shopping",
  "Health",
];

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
  const categories: SpendingCategory[] = raw
    .map((c) => ({ ...c, pct: Math.round((c.amount / total) * 100) }))
    .sort((a, b) => b.amount - a.amount);

  const result: SpendingBreakdownResult = {
    currency: "EGP",
    month: "This month",
    total,
    categories,
  };

  return { toolName: "showSpendingBreakdown", args: { period: "current_month" }, result };
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
];

export function wantsSpendingBreakdown(text: string): boolean {
  const lower = text.toLowerCase();
  return SPENDING_TRIGGERS.some((t) => lower.includes(t));
}

export interface DashboardStat {
  key: "balance" | "income" | "spending" | "savingsRate";
  value: number;
  deltaPct: number;
  /** Which direction of movement counts as positive for this stat. */
  goodDirection: "up" | "down";
}

export interface FinancialGoal {
  id: string;
  name: string;
  current: number;
  target: number;
}

export interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
}

/**
 * Fixed (non-random) placeholder numbers — no backend connected yet.
 * Kept deterministic so server and client render identically.
 */
export function getDashboardStats(): { currency: string; stats: DashboardStat[] } {
  return {
    currency: "EGP",
    stats: [
      { key: "balance", value: 128450, deltaPct: 4.2, goodDirection: "up" },
      { key: "income", value: 42000, deltaPct: 1.5, goodDirection: "up" },
      { key: "spending", value: 27860, deltaPct: -6.3, goodDirection: "down" },
      { key: "savingsRate", value: 34, deltaPct: 2, goodDirection: "up" },
    ],
  };
}

export function getFinancialGoals(): FinancialGoal[] {
  return [
    { id: "emergency-fund", name: "Emergency Fund", current: 45000, target: 60000 },
    { id: "new-car", name: "New Car", current: 18000, target: 150000 },
    { id: "vacation", name: "Vacation", current: 8000, target: 20000 },
  ];
}

export function getBudgetPlan(): { currency: string; categories: BudgetCategory[] } {
  return {
    currency: "EGP",
    categories: [
      { name: "Groceries", budget: 3000, spent: 2650 },
      { name: "Dining", budget: 1500, spent: 1800 },
      { name: "Transport", budget: 1200, spent: 950 },
      { name: "Utilities", budget: 1000, spent: 980 },
      { name: "Shopping", budget: 2000, spent: 2400 },
      { name: "Health", budget: 800, spent: 300 },
    ],
  };
}
