import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import type { DashboardFilters } from "@/types/dashboard";
import type { Budget } from "@/types/budget";
import * as dashboardApi from "@/api/dashboard";
import * as budgetApi from "@/api/budget";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { budgetKeys } from "@/queries/budget";

export const dashboardKeys = {
  summary: (filters: DashboardFilters) =>
    [QUERY_ROOTS.dashboard, "summary", filters] as const,
};

export function useDashboard(filters: DashboardFilters) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: dashboardKeys.summary(filters),
    queryFn: async () => {
      // Read GET /budget/ through the same query key useBudget() uses so the
      // two consumers share one cached request instead of each fetching it
      // independently. A planless user's expected 404 there just means no
      // budget yet — anything else is a real failure and should surface.
      const budget = await queryClient
        .ensureQueryData({
          queryKey: budgetKeys.detail,
          queryFn: () => budgetApi.getBudget(),
        })
        .catch((error): Budget | null => {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        });
      return dashboardApi.getDashboardSummary(filters, budget);
    },
    placeholderData: keepPreviousData,
  });
}
