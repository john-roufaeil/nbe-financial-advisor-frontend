import { useQuery } from "@tanstack/react-query";
import * as analyticsApi from "@/api/analytics";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";

export function useMonthlySummaries(from?: string, to?: string) {
  return useQuery({
    queryKey: [QUERY_ROOTS.analytics, "monthly-summaries", from, to],
    queryFn: () => analyticsApi.getMonthlySummaries(from, to),
  });
}

export function useCategoryBreakdown(period: string, accountId?: string) {
  return useQuery({
    queryKey: [QUERY_ROOTS.analytics, "category-breakdown", period, accountId],
    queryFn: () => analyticsApi.getCategoryBreakdown(period, accountId),
  });
}
