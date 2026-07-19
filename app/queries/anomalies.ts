import { useQuery } from "@tanstack/react-query";
import * as anomaliesApi from "@/api/anomalies";
import * as anomaliesMock from "@/mocks/anomalies";
import type { AnomalyFilters } from "@/types/anomaly";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl, useInvalidatingMutation } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, anomaliesApi, anomaliesMock);
}

export function useAnomalies(filters?: AnomalyFilters) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: [QUERY_ROOTS.anomalies, source, filters],
    queryFn: () => impl(source).getAnomalies(filters),
  });
}

export function useResolveAnomaly() {
  return useInvalidatingMutation({
    mutationFn: (source, { id, resolved }: { id: string; resolved: boolean }) =>
      impl(source).resolveAnomaly(id, resolved),
    invalidates: [[QUERY_ROOTS.anomalies]],
    successToastKey: "toast.anomalyResolved",
  });
}
