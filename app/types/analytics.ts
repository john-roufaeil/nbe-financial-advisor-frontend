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
