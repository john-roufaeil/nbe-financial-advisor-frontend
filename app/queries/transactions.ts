import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as transactionsApi from "@/api/transactions";
import * as transactionsMock from "@/mocks/transactions";
import type { TransactionFilters } from "@/api/transactions";
import type { Transaction } from "@/types/transaction";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastSuccess, toastApiError } from "@/lib/toast";

function impl(source: DataSource) {
  return source === "mock" ? transactionsMock : transactionsApi;
}

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters, source: DataSource) =>
    [...transactionKeys.all, "list", source, filters] as const,
};

export function useTransactions(filters: TransactionFilters) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: transactionKeys.list(filters, source),
    queryFn: () => impl(source).getTransactions(filters),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: Omit<Transaction, "id">) => impl(source).createTransaction(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toastSuccess("toast.transactionCreated");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<Transaction, "id">>;
    }) => impl(source).updateTransaction(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toastSuccess("toast.transactionUpdated");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      toastSuccess("toast.transactionDeleted");
    },
    onError: (error) => toastApiError(error),
  });
}
