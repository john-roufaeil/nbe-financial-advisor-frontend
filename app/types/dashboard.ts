export interface DashboardStat {
  key: "balance" | "income" | "spending" | "savingsRate";
  value: number;
  deltaPct: number;
  /** Which direction of movement counts as positive for this stat. */
  goodDirection: "up" | "down";
}

export interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
}

export interface DashboardSummary {
  currency: string;
  stats: DashboardStat[];
  budget: { categories: BudgetCategory[] };
}
