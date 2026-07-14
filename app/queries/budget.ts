import { useQuery } from "@tanstack/react-query";
import * as budgetApi from "@/api/budget";
import * as budgetMock from "@/mocks/budget";
import type { CreateBudgetBody, UpdateBudgetBody } from "@/types/budget";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl, useInvalidatingMutation } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, budgetApi, budgetMock);
}

export const budgetKeys = {
  starterTemplates: (source: DataSource) =>
    [QUERY_ROOTS.budget, "starter-templates", source] as const,
  detail: (source: DataSource) => [QUERY_ROOTS.budget, "detail", source] as const,
};

export function useStarterTemplates() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: budgetKeys.starterTemplates(source),
    queryFn: () => impl(source).getStarterTemplates(),
  });
}

export function useBudget() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: budgetKeys.detail(source),
    queryFn: () => impl(source).getBudget(),
  });
}

// On failure both mutations surface the error (no fake success); the caller
// stays on the step.

export function useCreateBudget() {
  return useInvalidatingMutation({
    mutationFn: (source, body: CreateBudgetBody) => impl(source).createBudget(body),
    invalidates: [[QUERY_ROOTS.budget], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.budgetCreated",
  });
}

export function useUpdateBudget() {
  return useInvalidatingMutation({
    mutationFn: (source, body: UpdateBudgetBody) => impl(source).updateBudget(body),
    invalidates: [[QUERY_ROOTS.budget], [QUERY_ROOTS.dashboard], [QUERY_ROOTS.goals]],
    successToastKey: "toast.budgetUpdated",
  });
}
