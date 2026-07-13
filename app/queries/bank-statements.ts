import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import * as bankStatementsApi from "@/api/bank-statements";
import * as bankStatementsMock from "@/mocks/bank-statements";
import type { BankStatementFilters } from "@/api/bank-statements";
import type { BankStatementType, ExtractedTransaction } from "@/types/bank-statement";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastSuccess, toastApiError } from "@/lib/toast";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";

function impl(source: DataSource) {
  return source === "mock" ? bankStatementsMock : bankStatementsApi;
}

export const bankStatementKeys = {
  all: [QUERY_ROOTS.bankStatements] as const,
  list: (filters: BankStatementFilters, source: DataSource) =>
    [...bankStatementKeys.all, "list", source, filters] as const,
  detail: (id: string, source: DataSource) =>
    [...bankStatementKeys.all, "detail", source, id] as const,
};

export function useBankStatements(filters: BankStatementFilters) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: bankStatementKeys.list(filters, source),
    queryFn: () => impl(source).getBankStatements(filters),
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const hasInFlight = query.state.data?.items?.some(
        (d) => d.status === "uploading" || d.status === "processing",
      );
      return hasInFlight ? 1000 : false;
    },
  });
}

export function useBankStatement(id: string | null) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: bankStatementKeys.detail(id ?? "", source),
    queryFn: () => impl(source).getBankStatement(id as string),
    enabled: id !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "uploading" || status === "processing" ? 1000 : false;
    },
  });
}

export function useUploadBankStatements() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (
      files: { name: string; type: BankStatementType; sizeKb: number; file: File }[],
    ) =>
      source === "mock"
        ? bankStatementsMock.uploadBankStatements(files)
        : bankStatementsApi.uploadBankStatements(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankStatementKeys.all });
      toastSuccess("toast.bankStatementUploaded");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useRetryBankStatement() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).retryBankStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankStatementKeys.all });
      toastSuccess("toast.bankStatementRetried");
    },
    onError: (error) => toastApiError(error),
  });
}

/**
 * Extracted-row edits are kept purely client-side while a statement is under
 * review (see BankStatementDetailModal) — the only request this screen ever sends
 * is the approve call below, with the user's final edited rows attached.
 */
export function useApproveBankStatement() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    // `accountId` is the account the user confirmed during review. There is no
    // separate confirm-account endpoint — approve is the one call that takes it.
    mutationFn: ({
      id,
      transactions,
      accountId,
    }: {
      id: string;
      transactions: ExtractedTransaction[];
      accountId?: string;
    }) => impl(source).approveBankStatement(id, transactions, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankStatementKeys.all });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.transactions] });
      // Approving commits rows straight into the ledger, so the dashboard's spend,
      // deltas, savings rate and per-category usage are all restated by it.
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
      toastSuccess("toast.bankStatementApproved");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useDeleteBankStatement() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).deleteBankStatement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankStatementKeys.all });
      toastSuccess("toast.bankStatementDeleted");
    },
    onError: (error) => toastApiError(error),
  });
}
