/**
 * GET /analytics/recurring-charges — detected subscriptions/regular bills.
 * Read-only over whatever the backend's detection job has already found;
 * that job doesn't run yet as of this writing, so this list is expected to
 * be empty for most users today (same shape as AnomalyFlag/AnomaliesCard —
 * the API/UI exist ahead of the job, not the other way around).
 */
export interface RecurringCharge {
  id: string;
  merchantNormalized: string;
  /** Backend-detected cadence (e.g. "monthly") — no fixed enum documented, shown as-is. */
  frequency: string;
  avgAmount: number;
  lastOccurrenceDate: string;
  nextExpectedDate: string | null;
}

export interface RecurringChargeFilters {
  accountId?: string;
}
