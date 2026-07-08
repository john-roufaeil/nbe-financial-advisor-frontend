import { useQuery } from "@tanstack/react-query";
import * as dashboardApi from "@/api/dashboard";
import * as dashboardMock from "@/mocks/dashboard";
import { useDataSourceStore } from "@/store/use-data-source-store";

export const dashboardKeys = {
  summary: (source: string) => ["dashboard", "summary", source] as const,
};

export function useDashboard() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: dashboardKeys.summary(source),
    queryFn: () =>
      (source === "mock" ? dashboardMock : dashboardApi).getDashboardSummary(),
  });
}
