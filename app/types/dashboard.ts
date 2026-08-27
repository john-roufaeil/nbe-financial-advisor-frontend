export const DASHBOARD_PERIODS = [
  "thisMonth",
  "lastMonth",
  "last3Months",
  "thisYear",
  "last5Years",
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

export const STABILITY_LABELS = ["stable", "variable", "unstable"] as const;
export type StabilityLabel = (typeof STABILITY_LABELS)[number];

/**
 * A 0-100 score for how CONSISTENT (not how much) income is month to month —
 * not to be confused with the savings-rate stat, which used to be shown
 * under this label by mistake (see api/dashboard.ts). `null` means fewer
 * than 2 months of credit-inflow history, not a zero score.
 */
export interface IncomeStability {
  score: number;
  label: StabilityLabel;
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
  stability: IncomeStability | null;
}
