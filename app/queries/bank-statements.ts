import { useQuery, keepPreviousData } from "@tanstack/react-query";
import * as bankStatementsApi from "@/api/bank-statements";
import * as bankStatementsMock from "@/mocks/bank-statements";
import type { BankStatementFilters } from "@/api/bank-statements";
import type { BankStatementType, ExtractedTransaction } from "@/types/bank-statement";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl, useInvalidatingMutation } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, bankStatementsApi, bankStatementsMock);
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
    // Stop polling when the statement no longer exists (deleted) or terminal status
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const status = query.state.data?.status;
      return status === "uploading" || status === "processing" ? 1000 : false;
    },
    // Don't retry 404s — the statement was deleted, retrying won't help
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return failureCount < 3;
    },
  });
}

export function useUploadBankStatements() {
  return useInvalidatingMutation({
    mutationFn: (
      source,
      files: { name: string; type: BankStatementType; sizeKb: number; file: File }[],
    ) =>
      source === "mock"
        ? bankStatementsMock.uploadBankStatements(files)
        : bankStatementsApi.uploadBankStatements(files),
    invalidates: [bankStatementKeys.all],
    successToastKey: "toast.bankStatementUploaded",
  });
}

export function useRetryBankStatement() {
  return useInvalidatingMutation({
    mutationFn: (source, id: string) => impl(source).retryBankStatement(id),
    invalidates: [bankStatementKeys.all],
    successToastKey: "toast.bankStatementRetried",
  });
}

/**
 * Extracted-row edits are kept purely client-side while a statement is under
 * review (see BankStatementDetailModal) — the only request this screen ever sends
 * is the approve call below, with the user's final edited rows attached.
 *
 * Approving commits rows straight into the ledger, so the transactions list
 * and the dashboard's spend, deltas, savings rate and per-category usage are
 * all restated by it.
 */
export function useApproveBankStatement() {
  return useInvalidatingMutation({
    // `accountId` is the account the user confirmed during review. There is no
    // separate confirm-account endpoint — approve is the one call that takes it.
    mutationFn: (
      source,
      {
        id,
        transactions,
        accountId,
      }: {
        id: string;
        transactions: ExtractedTransaction[];
        accountId?: string;
      },
    ) => impl(source).approveBankStatement(id, transactions, accountId),
    invalidates: [
      bankStatementKeys.all,
      [QUERY_ROOTS.transactions],
      [QUERY_ROOTS.dashboard],
    ],
    successToastKey: "toast.bankStatementApproved",
  });
}

export function useDeleteBankStatement() {
  return useInvalidatingMutation({
    mutationFn: (source, id: string) => impl(source).deleteBankStatement(id),
    // Evict the detail entry before the list invalidation refetches — prevents
    // a 404 console error from the detail query trying to reload a deleted resource.
    removes: (id) => [
      bankStatementKeys.detail(id, "backend"),
      bankStatementKeys.detail(id, "mock"),
    ],
    // An approved statement's committed rows are removed with it, so the
    // ledger and dashboard totals need restating too.
    invalidates: [
      bankStatementKeys.all,
      [QUERY_ROOTS.transactions],
      [QUERY_ROOTS.dashboard],
    ],
    successToastKey: "toast.bankStatementDeleted",
  });
}
