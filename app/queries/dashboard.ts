import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { DashboardFilters } from "@/types/dashboard";
import * as dashboardApi from "@/api/dashboard";
import * as dashboardMock from "@/mocks/dashboard";
import { useDataSourceStore } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl } from "@/queries/shared";

export const dashboardKeys = {
  summary: (source: string, filters: DashboardFilters) =>
    [QUERY_ROOTS.dashboard, "summary", source, filters] as const,
};

export function useDashboard(filters: DashboardFilters) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: dashboardKeys.summary(source, filters),
    queryFn: () =>
      pickImpl(source, dashboardApi, dashboardMock).getDashboardSummary(filters),
    placeholderData: keepPreviousData,
  });
}
