import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as budgetApi from "@/api/budget";
import * as budgetMock from "@/mocks/budget";
import type { CreateBudgetBody, UpdateBudgetBody } from "@/types/budget";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastSuccess, toastApiError } from "@/lib/toast";

function impl(source: DataSource) {
  return source === "mock" ? budgetMock : budgetApi;
}

export const budgetKeys = {
  starterTemplates: (source: DataSource) =>
    ["budget", "starter-templates", source] as const,
  detail: (source: DataSource) => ["budget", "detail", source] as const,
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

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: CreateBudgetBody) => impl(source).createBudget(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toastSuccess("toast.budgetCreated");
    },
    // Failure surfaces (no fake success); the caller stays on the step.
    onError: (error) => toastApiError(error),
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: UpdateBudgetBody) => impl(source).updateBudget(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toastSuccess("toast.budgetUpdated");
    },
    onError: (error) => toastApiError(error),
  });
}
