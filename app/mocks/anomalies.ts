import { delay } from "@/mocks/shared";
import type { AnomalyFlag, AnomalyFilters } from "@/types/anomaly";

let anomalies: AnomalyFlag[] = [
  {
    id: "anomaly-1",
    transaction_id: null,
    account_id: "acc-nbe-1",
    category: "dining",
    month: "2026-07-01",
    amount: "2400.00",
    reason: "Dining spend is 3x your usual monthly average.",
    severity: "medium",
    resolved: false,
    detected_at: "2026-07-18T10:00:00Z",
  },
];

export function getAnomalies(filters?: AnomalyFilters): Promise<AnomalyFlag[]> {
  let result = anomalies;
  if (filters?.account_id)
    result = result.filter((a) => a.account_id === filters.account_id);
  if (filters?.severity) result = result.filter((a) => a.severity === filters.severity);
  if (filters?.resolved !== undefined) {
    result = result.filter((a) => a.resolved === filters.resolved);
  }
  return delay(result);
}

export function resolveAnomaly(id: string, resolved: boolean): Promise<AnomalyFlag> {
  anomalies = anomalies.map((a) => (a.id === id ? { ...a, resolved } : a));
  const updated = anomalies.find((a) => a.id === id);
  if (!updated) throw new Error("Anomaly not found");
  return delay(updated);
}
