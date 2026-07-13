import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as transactionsApi from "@/api/transactions";
import * as transactionsMock from "@/mocks/transactions";
import type { TransactionFilters } from "@/api/transactions";
import type { Transaction } from "@/types/transaction";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl, useInvalidatingMutation } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, transactionsApi, transactionsMock);
}

export const transactionKeys = {
  all: [QUERY_ROOTS.transactions] as const,
  list: (filters: TransactionFilters, source: DataSource) =>
    [...transactionKeys.all, "list", source, filters] as const,
};

export function useTransactions(filters: TransactionFilters) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: transactionKeys.list(filters, source),
    queryFn: () => impl(source).getTransactions(filters),
    placeholderData: keepPreviousData,
  });
}

// Every mutation invalidates the dashboard and goals alongside the ledger:
// each dashboard number is computed from the ledger — spend, inflow, the
// month-over-month deltas, the savings rate, and each category's
// percentage_used — and goal progress (GoalCard's `current`) is computed
// server-side from the ledger too. A changed transaction restates all of them.
const TRANSACTION_INVALIDATES = [
  transactionKeys.all,
  [QUERY_ROOTS.dashboard],
  [QUERY_ROOTS.goals],
] as const;

export function useCreateTransaction() {
  return useInvalidatingMutation({
    mutationFn: (source, body: Omit<Transaction, "id">) =>
      impl(source).createTransaction(body),
    invalidates: TRANSACTION_INVALIDATES,
    successToastKey: "toast.transactionCreated",
  });
}

export function useUpdateTransaction() {
  return useInvalidatingMutation({
    mutationFn: (
      source,
      { id, patch }: { id: string; patch: Partial<Omit<Transaction, "id">> },
    ) => impl(source).updateTransaction(id, patch),
    invalidates: TRANSACTION_INVALIDATES,
    successToastKey: "toast.transactionUpdated",
  });
}

export function useDeleteTransaction() {
  return useInvalidatingMutation({
    mutationFn: (source, id: string) => impl(source).deleteTransaction(id),
    invalidates: TRANSACTION_INVALIDATES,
    successToastKey: "toast.transactionDeleted",
  });
}
