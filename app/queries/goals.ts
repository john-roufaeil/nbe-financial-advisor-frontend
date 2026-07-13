import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as goalsApi from "@/api/goals";
import * as goalsMock from "@/mocks/goals";
import type { FinancialGoal } from "@/types/goal";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastSuccess, toastApiError } from "@/lib/toast";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";

function impl(source: DataSource) {
  return source === "mock" ? goalsMock : goalsApi;
}

export const goalKeys = {
  all: (source: DataSource) => [QUERY_ROOTS.goals, source] as const,
};

export function useGoals() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: goalKeys.all(source),
    queryFn: () => impl(source).getGoals(),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: Omit<FinancialGoal, "id">) => impl(source).createGoal(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.goals] });
      // The dashboard renders the goal card from its own payload, not from /goal.
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
      toastSuccess("toast.goalCreated");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Omit<FinancialGoal, "id"> }) =>
      impl(source).updateGoal(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.goals] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
      toastSuccess("toast.goalUpdated");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.goals] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
      toastSuccess("toast.goalDeleted");
    },
    onError: (error) => toastApiError(error),
  });
}
