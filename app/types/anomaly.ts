export const ANOMALY_SEVERITIES = ["low", "medium", "high"] as const;
export type AnomalySeverity = (typeof ANOMALY_SEVERITIES)[number];

/**
 * A flagged anomalous transaction or spending pattern (GET /analytics/anomalies,
 * AnomalyFlagSerializer). `transaction_id` is null for anomalies detected by
 * the post-ingestion analysis pass, which aggregates at (account, category,
 * month) grain instead of pointing at one transaction — `category`/`month`/
 * `amount` are what make those rows meaningful instead.
 */
export interface AnomalyFlag {
  id: string;
  transaction_id: string | null;
  account_id: string | null;
  category: string | null;
  month: string | null;
  amount: string | number | null;
  reason: string;
  severity: AnomalySeverity;
  resolved: boolean;
  detected_at: string;
}

export interface AnomalyFilters {
  account_id?: string;
  severity?: AnomalySeverity;
  resolved?: boolean;
}
