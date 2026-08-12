export interface TopMerchant {
  merchant: string | null;
  /**
   * A plain magnitude — the backend sums Sum("amount") per merchant across
   * BOTH transaction directions with no transaction_type filter, so this can
   * mix income and spend for one merchant (e.g. a salary payer) with no way
   * to tell which from this field alone. Rendered as neutral activity, not
   * colored/labeled as spend or income.
   */
  total: number;
}

/** One calendar month's transaction summary (GET /analytics/monthly-summaries). */
export interface MonthlySummary {
  /** ISO date, first of the month. */
  month: string;
  totalSpend: number;
  totalInflow: number;
  topMerchants: TopMerchant[];
}

export interface CategoryBreakdownEntry {
  category: string;
  /** Same caveat as TopMerchant.total above — sums both transaction directions, not spend-only. */
  amount: number;
  percentageOfTotal: number;
}

/**
 * GET /analytics/category-breakdown?period=YYYY-MM — every category's total
 * for one calendar month, independent of any budget plan (unlike the
 * dashboard's allocations_summary, which is empty for a planless user).
 */
export interface CategoryBreakdown {
  period: string;
  breakdown: CategoryBreakdownEntry[];
}
