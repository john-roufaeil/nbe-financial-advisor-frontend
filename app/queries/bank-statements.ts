import { useEffect, useRef } from "react";
import {
  useQuery,
  useQueryClient,
  useMutation,
  keepPreviousData,
} from "@tanstack/react-query";
import * as bankStatementsApi from "@/api/bank-statements";
import type { BankStatementFilters } from "@/api/bank-statements";
import type {
  BankStatementStatus,
  BankStatementType,
  ExtractedTransaction,
} from "@/types/bank-statement";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";
import { toastApiError } from "@/lib/toast";

export const bankStatementKeys = {
  all: [QUERY_ROOTS.bankStatements] as const,
  list: (filters: BankStatementFilters) =>
    [...bankStatementKeys.all, "list", filters] as const,
  detail: (id: string) => [...bankStatementKeys.all, "detail", id] as const,
};

/**
 * OCR finishing (status -> "processed") is when the backend resolves/creates
 * the BankAccount for the statement (get_or_create on bank name + account
 * number) — well before the user ever hits approve. So the accounts list can
 * go stale right at that transition, not just on approve. This watches each
 * statement across successive fetches (the initial one plus whichever ones
 * the statement_status SSE event triggers — see useBankStatements/
 * useBankStatement below) for a processing -> processed edge, and invalidates
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
  const query = useQuery({
    queryKey: bankStatementKeys.list(filters),
    queryFn: () => bankStatementsApi.getBankStatements(filters),
    placeholderData: keepPreviousData,
    // No refetchInterval — process_statement_pipeline (core/tasks/statements.py)
    // publishes a statement_status SSE event when a statement's pipeline run
    // finishes either way; use-event-stream.ts invalidates this query on that
    // event instead of polling for the transition.
  });
  useInvalidateAccountsOnProcessed(
    query.data?.items?.map((d) => ({ id: d.id, status: d.status })) ?? [],
  );
  return query;
}

export function useBankStatement(id: string | null) {
  const query = useQuery({
    queryKey: bankStatementKeys.detail(id ?? ""),
    queryFn: () => bankStatementsApi.getBankStatement(id as string),
    enabled: id !== null,
    // No refetchInterval — same statement_status SSE event covers the detail
    // query too (bankStatementKeys.all is a prefix of bankStatementKeys.detail,
    // so use-event-stream.ts's invalidation reaches this one as well).
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
      files: { name: string; type: BankStatementType; sizeKb: number; file: File }[],
    ) => bankStatementsApi.uploadBankStatements(files),
    invalidates: [bankStatementKeys.all],
    successToastKey: "toast.bankStatementUploaded",
  });
}

export function useRetryBankStatement() {
  return useInvalidatingMutation({
    mutationFn: (id: string) => bankStatementsApi.retryBankStatement(id),
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
    mutationFn: ({
      id,
      transactions,
      accountId,
    }: {
      id: string;
      transactions: ExtractedTransaction[];
      accountId?: string;
    }) => bankStatementsApi.approveBankStatement(id, transactions, accountId),
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
    mutationFn: (id: string) => bankStatementsApi.deleteBankStatement(id),
    // Evict the detail entry before the list invalidation refetches — prevents
    // a 404 console error from the detail query trying to reload a deleted resource.
    removes: (id) => [bankStatementKeys.detail(id)],
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

export function useBulkDeleteBankStatements() {
  return useInvalidatingMutation({
    mutationFn: (ids: string[]) => bankStatementsApi.bulkDeleteBankStatements(ids),
    removes: (ids) => ids.map((id) => bankStatementKeys.detail(id)),
    invalidates: [
      bankStatementKeys.all,
      [QUERY_ROOTS.transactions],
      [QUERY_ROOTS.accounts],
      [QUERY_ROOTS.dashboard],
    ],
    successToastKey: "toast.bankStatementsDeleted",
  });
}

/** `enabled` should reflect whether OCR has plausibly run yet (see getStatementOcrResult) — pass false while a statement is still uploading/processing to avoid a guaranteed-404 request. */
export function useStatementOcrResult(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...bankStatementKeys.detail(id), "ocr-result"],
    queryFn: () => bankStatementsApi.getStatementOcrResult(id),
    enabled,
  });
}

/** No success toast — the browser's own download UI is the confirmation. */
export function useDownloadStatementOcrArtifact() {
  return useMutation({
    mutationFn: (id: string) => bankStatementsApi.downloadStatementOcrArtifact(id),
    onError: (error) => toastApiError(error),
  });
}
