import { useMutation, useQuery } from "@tanstack/react-query";
import * as budgetApi from "@/api/budget";
import * as budgetMock from "@/mocks/budget";
import type { CreateBudgetBody } from "@/types/budget";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastError } from "@/lib/toast";

function impl(source: DataSource) {
  return source === "mock" ? budgetMock : budgetApi;
}

export const budgetKeys = {
  starterTemplates: (source: DataSource) =>
    ["budget", "starter-templates", source] as const,
};

export function useStarterTemplates() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: budgetKeys.starterTemplates(source),
    queryFn: () => impl(source).getStarterTemplates(),
  });
}

export function useCreateBudget() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: CreateBudgetBody) => impl(source).createBudget(body),
    // Failure surfaces (no fake success); the caller stays on the step.
    onError: () => toastError(),
  });
}
