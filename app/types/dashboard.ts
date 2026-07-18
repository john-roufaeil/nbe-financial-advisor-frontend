export const DASHBOARD_PERIODS = [
  "thisMonth",
  "lastMonth",
  "last3Months",
  "thisYear",
] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

/** Dashboard-wide filters. `accountId` undefined means "all accounts". */
export interface DashboardFilters {
  period: DashboardPeriod;
  accountId?: string;
}

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
  /**
   * False when the user has no budget yet. GET /dashboard answers 200 with
   * `budget: null, goal: null, allocations_summary: []` in that case (not 404),
   * so without this flag a planless dashboard renders as a plan full of zeroes.
   */
  hasPlan: boolean;
  stats: DashboardStat[];
  budget: { categories: BudgetCategory[] };
}
