import { apiClient } from "@/api/client";
import type { Transaction } from "@/types/transaction";

export interface TransactionFilters {
  type?: "income" | "expense";
  category?: string;
  from?: string;
  to?: string;
  q?: string;
  offset?: number;
  limit?: number;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
}

export async function getTransactions(
  filters: TransactionFilters,
): Promise<TransactionListResponse> {
  const res = await apiClient.get<
    TransactionListResponse | { results: Transaction[]; count: number }
  >("/transactions", {
    params: filters,
  });
  // Map DRF LimitOffsetPagination response to the frontend's expected shape
  if ("results" in res.data) {
    return { items: res.data.results, total: res.data.count };
  }
  return res.data;
}

export async function createTransaction(
  body: Omit<Transaction, "id">,
): Promise<Transaction> {
  const res = await apiClient.post<Transaction>("/transactions", body);
  return res.data;
}

export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, "id">>,
): Promise<Transaction> {
  const res = await apiClient.patch<Transaction>(`/transactions/${id}`, patch);
  return res.data;
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
