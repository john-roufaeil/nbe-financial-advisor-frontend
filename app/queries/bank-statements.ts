import { useEffect, useRef } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import * as bankStatementsApi from "@/api/bank-statements";
import * as bankStatementsMock from "@/mocks/bank-statements";
import type { BankStatementFilters } from "@/api/bank-statements";
import type {
  BankStatementStatus,
  BankStatementType,
  ExtractedTransaction,
} from "@/types/bank-statement";
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

/**
 * OCR finishing (status -> "processed") is when the backend resolves/creates
 * the BankAccount for the statement (get_or_create on bank name + account
 * number) — well before the user ever hits approve. So the accounts list can
 * go stale right at that transition, not just on approve. This watches each
 * polled statement for a processing -> processed edge and invalidates
 * accounts exactly once per statement when it fires.
 */
function useInvalidateAccountsOnProcessed(
  statuses: { id: string; status: BankStatementStatus }[],
) {
  const queryClient = useQueryClient();
  const prevStatuses = useRef(new Map<string, BankStatementStatus>());
  // A single joined key, not one dep per status: the list's length changes as
  // statements are added/removed, and useEffect's dep array must stay a fixed
  // size across renders of the same hook instance.
  const statusesKey = statuses.map((s) => `${s.id}:${s.status}`).join(",");
  useEffect(() => {
    let becameProcessed = false;
    for (const { id, status } of statuses) {
      if (status === "processed" && prevStatuses.current.get(id) === "processing") {
        becameProcessed = true;
      }
      prevStatuses.current.set(id, status);
    }
    if (becameProcessed) {
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.accounts] });
    }
  }, [queryClient, statusesKey]);
}

export function useBankStatements(filters: BankStatementFilters) {
  const source = useDataSourceStore((s) => s.source);
  const query = useQuery({
    queryKey: bankStatementKeys.list(filters, source),
    queryFn: () => impl(source).getBankStatements(filters),
    placeholderData: keepPreviousData,
    // Stop polling once the request itself is erroring — otherwise stale
    // data left over from the last successful fetch (kept around by
    // keepPreviousData) can still show an item mid-processing and keep this
    // returning 1000 forever, hammering a broken endpoint every second.
    refetchInterval: (query) => {
      if (query.state.error) return false;
      const hasInFlight = query.state.data?.items?.some(
        (d) => d.status === "uploading" || d.status === "processing",
      );
      return hasInFlight ? 1000 : false;
    },
  });
  useInvalidateAccountsOnProcessed(
    query.data?.items?.map((d) => ({ id: d.id, status: d.status })) ?? [],
  );
  return query;
}

export function useBankStatement(id: string | null) {
  const source = useDataSourceStore((s) => s.source);
  const query = useQuery({
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
  useInvalidateAccountsOnProcessed(
    id && query.data ? [{ id, status: query.data.status }] : [],
  );
  return query;
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
 * Approving commits rows straight into the ledger, so the transactions list,
 * the accounts list (a new account may have been created/confirmed for this
 * statement) and the dashboard's spend, deltas, savings rate and per-category
 * usage are all restated by it.
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
      [QUERY_ROOTS.accounts],
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
    // ledger, accounts (e.g. current_balance) and dashboard totals need
    // restating too.
    invalidates: [
      bankStatementKeys.all,
      [QUERY_ROOTS.transactions],
      [QUERY_ROOTS.accounts],
      [QUERY_ROOTS.dashboard],
    ],
    successToastKey: "toast.bankStatementDeleted",
  });
}
