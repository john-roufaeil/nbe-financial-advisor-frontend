import { useQuery } from "@tanstack/react-query";
import * as anomaliesApi from "@/api/anomalies";
import type { AnomalyFilters } from "@/types/anomaly";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";

export function useAnomalies(filters?: AnomalyFilters) {
  return useQuery({
    queryKey: [QUERY_ROOTS.anomalies, filters],
    queryFn: () => anomaliesApi.getAnomalies(filters),
  });
}

export function useResolveAnomaly() {
  return useInvalidatingMutation({
    mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) =>
      anomaliesApi.resolveAnomaly(id, resolved),
    invalidates: [[QUERY_ROOTS.anomalies]],
    successToastKey: "toast.anomalyResolved",
  });
}
