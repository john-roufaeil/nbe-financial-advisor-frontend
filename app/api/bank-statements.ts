import { apiClient } from "@/api/client";
import { getAccounts } from "@/api/accounts";
import { getTransactionsByStatement } from "@/api/transactions";
import { getBankCode } from "@/lib/banks";
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

/** A row exactly as GET /statements returns it (StatementFileSerializer). */
interface RawStatement {
  id: string;
  account_id: string | null;
  /** "pending" | "normalized" today. No DB-level `choices`, so treat as open. */
  status: string;
  start_transaction_date: string | null;
  last_transaction_date: string | null;
  upload_date: string;
  /** Always null — the column doesn't exist yet, the serializer hardcodes it. */
  failure_reason: string | null;
}

/** One row of `normalized_json.transactions` from GET /statements/{id}/normalized. */
interface RawNormalizedTransaction {
  transaction_date: string;
  merchant_raw: string;
  category: string | null;
  amount: number;
  transaction_type: string | null;
  duplicate_of: string | null;
}

interface RawNormalizedResponse {
  statement_id: string;
  model_used: string | null;
  adjusted_at: string;
  transaction_count: number;
  normalized_json: {
    bank_name?: string;
    account_hint?: string;
    transactions?: RawNormalizedTransaction[];
  };
}

interface PaginatedStatements {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawStatement[];
}

// ── Field mapping ─────────────────────────────────────────────────────────────
// StatementFileSerializer exposes only id/account_id/status/dates/failure_reason.
// It carries no original filename, MIME type or byte size, so `name`, `type` and
// `sizeKb` are unavailable in backend mode and stay undefined — the UI falls
// back rather than inventing values. See docs/frontend-wiring-gaps.md.

/**
 * The backend's mock pipeline runs synchronously inside POST /statements and
 * commits transactions straight to the ledger, so a statement is already
 * "normalized" by the time the response lands. There is no pending-approval
 * state server-side, hence `approved: true` for anything normalized: the
 * transactions are in the ledger whether the UI shows an approve button or not.
 */
function toStatus(raw: string): BankStatementStatus {
  if (raw === "normalized" || raw === "processed") return "processed";
  if (raw === "failed") return "failed";
  return "processing";
}

function toBankStatement(raw: RawStatement, bankName?: string): BankStatement {
  const status = toStatus(raw.status);
  const approved = status === "processed";
  return {
    id: raw.id,
    accountId: raw.account_id ?? undefined,
    uploadDate: raw.upload_date,
    status,
    // A stored failed statement got uploaded fine (upload errors surface as HTTP
    // failures at POST time), so recovery is a processing retry, not a re-upload.
    failedStage: status === "failed" ? "processing" : undefined,
    approved,
    // No pending-account-confirmation concept server-side either; the backend
    // already resolves account_id (or leaves it unset) by the time it responds.
    accountConfirmed: status === "processed",
    // Rows are edited/added client-side only while under review and are never
    // sent until the (currently unsupported) approve call — see approveBankStatement.
    // Since the backend has no pending-approval state, `approved` is already
    // true the moment a statement finishes processing, so editing is disabled
    // from that same moment: the transactions are already committed server-side.
    canEditTransactions: !approved,
    canAddTransactions: !approved,
    bankName,
  };
}

/** Resolve account_id -> bank code so the list can show a logo. One extra call. */
async function bankCodesByAccountId(): Promise<Map<string, string | undefined>> {
  const accounts = await getAccounts();
  return new Map(accounts.map((a) => [a.id, getBankCode(a.bank_name)]));
}

// ── Calls ─────────────────────────────────────────────────────────────────────

/**
 * GET /statements supports only `status`, `account_id`, `limit` and `offset`.
 * The tab's type / search / date-range controls have no server-side equivalent,
 * so they are not sent — filtering client-side would desync `total` from the
 * server's unfiltered count and break pagination.
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
  const banks = await bankCodesByAccountId();

  return {
    items: res.data.results.map((raw) =>
      toBankStatement(raw, raw.account_id ? banks.get(raw.account_id) : undefined),
    ),
    total: res.data.count,
  };
}

export async function getBankStatement(id: string): Promise<BankStatement> {
  const res = await apiClient.get<RawStatement>(API_ENDPOINTS.statement(id));
  const banks = await bankCodesByAccountId();
  const doc = toBankStatement(
    res.data,
    res.data.account_id ? banks.get(res.data.account_id) : undefined,
  );

  if (doc.status !== "processed") return doc;

  // The extracted rows are already in the ledger (with real UUIDs), which is what
  // makes them editable. /normalized/ is still worth a look for the bank name,
  // which the statement row itself doesn't carry when no account was supplied.
  const [transactions, bankName] = await Promise.all([
    getTransactionsByStatement(id),
    doc.bankName
      ? Promise.resolve(doc.bankName)
      : apiClient
          .get<RawNormalizedResponse>(`/statements/${id}/normalized`)
          .then((r) => getBankCode(r.data.normalized_json.bank_name))
          .catch(() => undefined),
  ]);

  return { ...doc, bankName, extractedTransactions: transactions };
}

/**
 * POST /statements accepts exactly ONE file per request, under the field name
 * `file` (not `files`). Uploading N bank statements is therefore N requests, issued
 * in parallel. A byte-identical re-upload is rejected with 422 by the backend's
 * checksum dedupe, so one file failing must not discard the others' results.
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

  // Every file failed — surface the first error rather than reporting success.
  const firstRejection = results.find((r) => r.status === "rejected");
  if (uploaded.length === 0 && firstRejection) {
    throw firstRejection.reason;
  }
  return uploaded;
}

export async function deleteBankStatement(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.statement(id));
}

// ── Not implemented server-side ───────────────────────────────────────────────
// POST /statements/{id}/retry and POST /statements/{id}/approve do not exist in
// core/urls.py. The mock pipeline never fails and commits transactions itself,
// so there is nothing to retry or approve. Throwing surfaces an honest error
// instead of an opaque 404.

const UNSUPPORTED = "This action isn't supported by the backend yet.";

export async function retryBankStatement(_id: string): Promise<BankStatement> {
  throw new Error(UNSUPPORTED);
}

export async function approveBankStatement(
  _id: string,
  _transactions: ExtractedTransaction[],
): Promise<{ approvedAt: string; createdTransactionIds: string[] }> {
  throw new Error(UNSUPPORTED);
}

export async function confirmBankStatementAccount(
  _id: string,
  _accountId: string,
): Promise<BankStatement> {
  throw new Error(UNSUPPORTED);
}
