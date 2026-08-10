import { useQuery } from "@tanstack/react-query";
import * as goalsApi from "@/api/goals";
import type { FinancialGoal } from "@/types/goal";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";

export const goalKeys = {
  all: [QUERY_ROOTS.goals] as const,
};

export function useGoals() {
  return useQuery({
    queryKey: goalKeys.all,
    queryFn: () => goalsApi.getGoals(),
  });
}

// Mutations also invalidate the dashboard: it renders the goal card from its
// own payload, not from /goal.

export function useCreateGoal() {
  return useInvalidatingMutation({
    mutationFn: (body: Omit<FinancialGoal, "id">) => goalsApi.createGoal(body),
    invalidates: [[QUERY_ROOTS.goals], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.goalCreated",
  });
}

export function useUpdateGoal() {
  return useInvalidatingMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Omit<FinancialGoal, "id"> }) =>
      goalsApi.updateGoal(id, patch),
    invalidates: [[QUERY_ROOTS.goals], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.goalUpdated",
  });
}

export function useDeleteGoal() {
  return useInvalidatingMutation({
    mutationFn: (id: string) => goalsApi.deleteGoal(id),
    invalidates: [[QUERY_ROOTS.goals], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.goalDeleted",
  });
}
