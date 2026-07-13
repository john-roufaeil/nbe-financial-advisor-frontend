import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  BankStatement,
  BankStatementStatus,
  BankStatementType,
  ExtractedTransaction,
} from "@/types/bank-statement";

export interface BankStatementFilters {
  type?: BankStatementType;
  q?: string;
  from?: string;
  to?: string;
  sort?: "asc" | "desc";
  offset?: number;
  limit?: number;
}

export interface BankStatementListResponse {
  items: BankStatement[];
  total: number;
}

/** A statement exactly as the backend returns it (StatementFile / StatementDetail). */
interface RawStatement {
  id: string;
  account_id: string | null;
  /** "uploaded" | "extracted" | "normalized" | "approved". There is NO "failed". */
  status: string;
  /** The real "still working" signal — status alone cannot tell you this. */
  is_processing: boolean;
  failure_reason: string | null;
  failed_phase: string | null;
  file_size: number | null;
  file_type: string | null;
  bank_name: string | null;
  account_hint: string | null;
  start_transaction_date: string | null;
  last_transaction_date: string | null;
  upload_date: string;
  /** Present once normalized/approved: the proposed batch, then the committed rows. */
  transactions: RawStatementTransaction[] | null;
}

interface RawStatementTransaction {
  transaction_date: string;
  merchant_raw: string | null;
  category: string | null;
  amount: string | number;
  transaction_type: string | null;
}

interface PaginatedStatements {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawStatement[];
}

// ── Mapping ───────────────────────────────────────────────────────────────────

/**
 * The backend has four stages and no "failed" status. We collapse them onto the
 * UI's vocabulary:
 *   is_processing        -> "processing"  (a phase is actively running)
 *   failure_reason set   -> "failed"      (a phase stopped; status stayed put)
 *   normalized|approved  -> "processed"   (rows exist and are viewable)
 *   uploaded|extracted   -> "processing"  (nothing to show the user yet)
 */
function toStatus(raw: RawStatement): BankStatementStatus {
  if (raw.is_processing) return "processing";
  if (raw.failure_reason) return "failed";
  if (raw.status === "normalized" || raw.status === "approved") return "processed";
  return "processing";
}

function toExtractedTransaction(
  raw: RawStatementTransaction,
  index: number,
): ExtractedTransaction {
  return {
    // The proposed batch has no per-row id and approval doesn't match on one, so
    // this is a client-side key for the review draft only — never sent back.
    id: String(index),
    datetime: `${raw.transaction_date}T00:00:00`,
    title: raw.merchant_raw ?? "",
    category: raw.category ?? "",
    type: raw.transaction_type === "credit" ? "income" : "expense",
    amount: Math.abs(Number(raw.amount)),
  };
}

function toBankStatement(raw: RawStatement): BankStatement {
  const status = toStatus(raw);
  // "approved" is the ONLY terminal, committed state. "normalized" means the rows
  // are a PROPOSAL awaiting the user's review — that is when editing is allowed.
  const approved = raw.status === "approved";
  const isAwaitingReview = raw.status === "normalized";

  return {
    id: raw.id,
    sizeKb: raw.file_size ? Math.max(1, Math.round(raw.file_size / 1024)) : undefined,
    uploadDate: raw.upload_date,
    status,
    // The file uploaded fine (an upload error would have failed the POST), so any
    // failure here is a processing failure and a retry can re-run the pipeline.
    failedStage: status === "failed" ? "processing" : undefined,
    errorMessage: raw.failure_reason ?? undefined,
    approved,
    accountId: raw.account_id ?? undefined,
    // bank_name/account_hint come straight off the statement — no extra lookups.
    bankName: raw.bank_name ?? undefined,
    perceivedAccountNumber: raw.account_hint ?? undefined,
    // There is no "confirm the account" call: the account reaches the server only
    // as the optional `account_id` on approve. Confirming is therefore a purely
    // client-side review step, tracked in the modal — all this flag says is that
    // an approved statement has nothing left to confirm.
    accountConfirmed: approved,
    // Rows are editable ONLY while awaiting review: approval commits whatever the
    // draft holds, so a row can be edited, dropped, or added right up until then.
    canEditTransactions: isAwaitingReview,
    canAddTransactions: isAwaitingReview,
    extractedTransactions: raw.transactions?.map(toExtractedTransaction),
  };
}

// ── Calls ─────────────────────────────────────────────────────────────────────

/**
 * GET /statements supports ONLY account_id, status, limit, offset. The tab's
 * type/search/date controls have no server-side equivalent, so they are not sent
 * — filtering client-side would desync `total` from the server's unfiltered count
 * and silently break pagination.
 */
export async function getBankStatements(
  filters: BankStatementFilters,
): Promise<BankStatementListResponse> {
  const params: Record<string, string | number> = {};
  if (filters.offset !== undefined) params.offset = filters.offset;
  if (filters.limit !== undefined) params.limit = filters.limit;

  const res = await apiClient.get<PaginatedStatements>(API_ENDPOINTS.statements, {
    params,
  });
  return {
    items: res.data.results.map(toBankStatement),
    total: res.data.count,
  };
}

export async function getBankStatement(id: string): Promise<BankStatement> {
  const res = await apiClient.get<RawStatement>(API_ENDPOINTS.statement(id));
  return toBankStatement(res.data);
}

/**
 * POST /statements takes exactly ONE file per request, under the field name
 * `file` (singular). Uploading N statements is therefore N parallel requests.
 * A byte-identical re-upload is rejected as a duplicate, so one file failing
 * must not discard the others' results.
 */
export async function uploadBankStatements(
  files: { name: string; type: BankStatementType; sizeKb: number; file: File }[],
): Promise<BankStatement[]> {
  const results = await Promise.allSettled(
    files.map((f) => {
      const formData = new FormData();
      formData.append("file", f.file, f.name);
      return apiClient.post<RawStatement>(API_ENDPOINTS.statements, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }),
  );

  const uploaded: BankStatement[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") uploaded.push(toBankStatement(result.value.data));
  }

  const firstRejection = results.find((r) => r.status === "rejected");
  if (uploaded.length === 0 && firstRejection) {
    throw firstRejection.reason;
  }
  return uploaded;
}

export async function deleteBankStatement(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.statement(id));
}

/**
 * Retry/resume a stalled pipeline. Targeting a stage further out cascades through
 * the intermediate ones. 422 with error.code `already_approved`,
 * `already_processing`, or `invalid_status_transition` if the retry is invalid.
 */
export async function retryBankStatement(id: string): Promise<BankStatement> {
  const res = await apiClient.patch<RawStatement>(`/statements/${id}`, {
    status: "normalized",
  });
  return toBankStatement(res.data);
}

/**
 * Approve the reviewed batch — this is what actually commits the rows to the
 * ledger. The submitted array must match the proposed batch's length exactly,
 * matched by position (no per-row id); duplicates are re-checked at commit
 * time and silently skipped (`transaction_id: null`, `duplicate_of` set)
 * rather than treated as errors.
 *
 * `accountId` is optional and is the ONE place the account can be corrected —
 * there is no separate "confirm account" endpoint.
 */
export async function approveBankStatement(
  id: string,
  transactions: ExtractedTransaction[],
  accountId?: string,
): Promise<{ approvedAt: string; createdTransactionIds: string[] }> {
  const body: Record<string, unknown> = {
    transactions: transactions.map((tx) => ({
      transaction_date: tx.datetime.slice(0, 10),
      merchant_raw: tx.title,
      category: tx.category,
      amount: tx.amount,
      transaction_type: tx.type === "income" ? "credit" : "debit",
    })),
  };
  if (accountId) body.account_id = accountId;

  const res = await apiClient.post<{
    statement_status: string;
    resolved: { transaction_id: string | null }[];
  }>(`/statements/${id}/transactions`, body);

  return {
    approvedAt: new Date().toISOString(),
    createdTransactionIds: res.data.resolved
      .map((r) => r.transaction_id)
      .filter((txId): txId is string => txId !== null),
  };
}
