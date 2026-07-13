import { useQuery } from "@tanstack/react-query";
import * as goalsApi from "@/api/goals";
import * as goalsMock from "@/mocks/goals";
import type { FinancialGoal } from "@/types/goal";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl, useInvalidatingMutation } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, goalsApi, goalsMock);
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

// Mutations also invalidate the dashboard: it renders the goal card from its
// own payload, not from /goal.

export function useCreateGoal() {
  return useInvalidatingMutation({
    mutationFn: (source, body: Omit<FinancialGoal, "id">) =>
      impl(source).createGoal(body),
    invalidates: [[QUERY_ROOTS.goals], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.goalCreated",
  });
}

export function useUpdateGoal() {
  return useInvalidatingMutation({
    mutationFn: (
      source,
      { id, patch }: { id: string; patch: Omit<FinancialGoal, "id"> },
    ) => impl(source).updateGoal(id, patch),
    invalidates: [[QUERY_ROOTS.goals], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.goalUpdated",
  });
}

export function useDeleteGoal() {
  return useInvalidatingMutation({
    mutationFn: (source, id: string) => impl(source).deleteGoal(id),
    invalidates: [[QUERY_ROOTS.goals], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.goalDeleted",
  });
}
