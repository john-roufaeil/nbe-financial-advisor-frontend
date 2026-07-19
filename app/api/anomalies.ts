import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { AnomalyFlag, AnomalyFilters } from "@/types/anomaly";

export async function getAnomalies(filters?: AnomalyFilters): Promise<AnomalyFlag[]> {
  const res = await apiClient.get<AnomalyFlag[]>(API_ENDPOINTS.anomalies, {
    params: filters,
  });
  return res.data;
}

export async function resolveAnomaly(
  id: string,
  resolved: boolean,
): Promise<AnomalyFlag> {
  const res = await apiClient.patch<AnomalyFlag>(API_ENDPOINTS.anomaly(id), { resolved });
  return res.data;
}
