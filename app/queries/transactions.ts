import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as transactionsApi from "@/api/transactions";
import type { TransactionFilters } from "@/api/transactions";
import type { Transaction } from "@/types/transaction";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";

export const transactionKeys = {
  all: [QUERY_ROOTS.transactions] as const,
  list: (filters: TransactionFilters) =>
    [...transactionKeys.all, "list", filters] as const,
};

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => transactionsApi.getTransactions(filters),
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
    mutationFn: (body: Omit<Transaction, "id">) =>
      transactionsApi.createTransaction(body),
    invalidates: TRANSACTION_INVALIDATES,
    successToastKey: "toast.transactionCreated",
  });
}

export function useUpdateTransaction() {
  return useInvalidatingMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<Transaction, "id">>;
    }) => transactionsApi.updateTransaction(id, patch),
    invalidates: TRANSACTION_INVALIDATES,
    successToastKey: "toast.transactionUpdated",
  });
}

export function useDeleteTransaction() {
  return useInvalidatingMutation({
    mutationFn: (id: string) => transactionsApi.deleteTransaction(id),
    invalidates: TRANSACTION_INVALIDATES,
    successToastKey: "toast.transactionDeleted",
  });
}
