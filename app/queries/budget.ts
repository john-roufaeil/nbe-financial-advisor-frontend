import { useQuery } from "@tanstack/react-query";
import * as budgetApi from "@/api/budget";
import type { CreateBudgetBody, UpdateBudgetBody } from "@/types/budget";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";

export const budgetKeys = {
  starterTemplates: [QUERY_ROOTS.budget, "starter-templates"] as const,
  detail: [QUERY_ROOTS.budget, "detail"] as const,
};

export function useStarterTemplates() {
  return useQuery({
    queryKey: budgetKeys.starterTemplates,
    queryFn: () => budgetApi.getStarterTemplates(),
  });
}

export function useBudget() {
  return useQuery({
    queryKey: budgetKeys.detail,
    queryFn: () => budgetApi.getBudget(),
  });
}

// On failure both mutations surface the error (no fake success); the caller
// stays on the step.

export function useCreateBudget() {
  return useInvalidatingMutation({
    mutationFn: (body: CreateBudgetBody) => budgetApi.createBudget(body),
    invalidates: [[QUERY_ROOTS.budget], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.budgetCreated",
  });
}

export function useUpdateBudget() {
  return useInvalidatingMutation({
    mutationFn: (body: UpdateBudgetBody) => budgetApi.updateBudget(body),
    invalidates: [[QUERY_ROOTS.budget], [QUERY_ROOTS.dashboard], [QUERY_ROOTS.goals]],
    successToastKey: "toast.budgetUpdated",
  });
}
