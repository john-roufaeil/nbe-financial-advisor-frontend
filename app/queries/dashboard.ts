import { useQuery } from "@tanstack/react-query";
import * as dashboardApi from "@/api/dashboard";
import * as dashboardMock from "@/mocks/dashboard";
import { useDataSourceStore } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl } from "@/queries/shared";

export const dashboardKeys = {
  summary: (source: string) => [QUERY_ROOTS.dashboard, "summary", source] as const,
};

export function useDashboard() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: dashboardKeys.summary(source),
    queryFn: () => pickImpl(source, dashboardApi, dashboardMock).getDashboardSummary(),
  });
}
