import { apiClient } from "@/api/client";
import type { Transaction } from "@/types/transaction";

export interface TransactionFilters {
  type?: "income" | "expense";
  category?: string;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  q?: string;
  sort?: "asc" | "desc";
  offset?: number;
  limit?: number;
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
}

/** A row exactly as GET /transactions returns it (TransactionListSerializer). */
interface RawTransaction {
  id: string;
  account_id: string;
  statement_id: string | null;
  /** Date only — "YYYY-MM-DD". The backend has no time component. */
  transaction_date: string;
  merchant_raw: string | null;
  merchant_normalized: string | null;
  category: string | null;
  /** DRF serializes DecimalField as a string by default. */
  amount: string;
  currency: string;
  is_recurring: boolean;
  confidence_score: string | null;
  source: string;
  balance: string | null;
  /** "debit" | "credit" | "fee" | "transfer" — nullable, no DB-level choices. */
  transaction_type: string | null;
  created_at: string;
}

interface PaginatedTransactions {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawTransaction[];
}

// ── Field mapping ─────────────────────────────────────────────────────────────
// The backend stores amounts unsigned and carries direction in `transaction_type`;
// the UI carries direction in `type` and renders the sign itself. Anything that
// isn't a credit (debit, fee, transfer, null) reduces the balance, so it maps to
// "expense". "transfer" is lossy in both directions — the UI has no concept of it.

function toUiType(
  transactionType: RawTransaction["transaction_type"],
): Transaction["type"] {
  return transactionType === "credit" ? "income" : "expense";
}

function toBackendType(type: Transaction["type"]): string {
  return type === "income" ? "credit" : "debit";
}

function toTransaction(raw: RawTransaction): Transaction {
  return {
    id: String(raw.id),
    // The UI formats a datetime; the backend only has a date. Pin to midnight.
    datetime: `${raw.transaction_date}T00:00:00`,
    title: raw.merchant_normalized || raw.merchant_raw || "",
    category: raw.category ?? "",
    type: toUiType(raw.transaction_type),
    amount: Math.abs(Number(raw.amount)),
    accountId: raw.account_id,
  };
}

/**
 * All of these are real, server-side django-filter params — see the backend's
 * TransactionFilterSet. The sort param is `sort` (NOT `ordering`) and free-text
 * search is `search` (NOT `q`); using the wrong name makes the filter a silent
 * no-op, because an unrecognized query param is ignored rather than rejected.
 *
 * `filters.type` is deliberately NOT sent. The backend's transaction_type filter
 * is exact-match on a SINGLE value, but the UI's "expense" means debit OR fee OR
 * transfer. Sending transaction_type=debit would silently hide the user's bank
 * fees from an "expenses" list. Verified: a seeded user with 40 transactions has
 * 32 debit + 2 fee + 6 credit; filtering on `debit` returns 32, hiding 2 real
 * outgoing charges. Restore this only once the backend supports an `in` lookup.
 */
function toQueryParams(filters: TransactionFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.category) params.category = filters.category;
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.minAmount !== undefined) params.min_amount = filters.minAmount;
  if (filters.maxAmount !== undefined) params.max_amount = filters.maxAmount;
  if (filters.q) params.search = filters.q;
  if (filters.sort)
    params.sort = filters.sort === "asc" ? "transaction_date" : "-transaction_date";
  if (filters.offset !== undefined) params.offset = filters.offset;
  if (filters.limit !== undefined) params.limit = filters.limit;
  return params;
}

// ── Calls ─────────────────────────────────────────────────────────────────────

export async function getTransactions(
  filters: TransactionFilters,
): Promise<TransactionListResponse> {
  const res = await apiClient.get<PaginatedTransactions>("/transactions", {
    params: toQueryParams(filters),
  });
  return { items: res.data.results.map(toTransaction), total: res.data.count };
}

/**
 * Every row the statement pipeline extracts is committed to the ledger with a
 * `statement` FK, so a statement's transactions ARE ordinary transactions.
 * GET /transactions has no `statement_id` filter though, so page through and
 * match client-side. Fine at demo scale; a server-side filter would be better.
 */
export async function getTransactionsByStatement(
  statementId: string,
): Promise<Transaction[]> {
  const PAGE = 100;
  const matches: RawTransaction[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const res = await apiClient.get<PaginatedTransactions>("/transactions", {
      params: { limit: PAGE, offset },
    });
    total = res.data.count;
    matches.push(...res.data.results.filter((r) => r.statement_id === statementId));
    if (res.data.results.length === 0) break;
    offset += PAGE;
  }
  return matches.map(toTransaction);
}

export async function createTransaction(
  body: Omit<Transaction, "id">,
): Promise<Transaction> {
  // POST /transactions requires an owned account_id. The add-transaction form
  // now collects it via an account picker, so no implicit GET /accounts lookup.
  if (!body.accountId) {
    throw new Error("An account must be selected to create a transaction.");
  }

  const res = await apiClient.post<RawTransaction>("/transactions", {
    account_id: body.accountId,
    transaction_date: body.datetime.slice(0, 10),
    merchant_raw: body.title,
    category: body.category,
    amount: body.amount,
    transaction_type: toBackendType(body.type),
  });
  return toTransaction(res.data);
}

export async function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, "id">>,
): Promise<Transaction> {
  // PATCH accepts only this subset (account_id and source are not patchable).
  const body: Record<string, unknown> = {};
  if (patch.datetime !== undefined) body.transaction_date = patch.datetime.slice(0, 10);
  if (patch.title !== undefined) body.merchant_raw = patch.title;
  if (patch.category !== undefined) body.category = patch.category;
  if (patch.amount !== undefined) body.amount = patch.amount;
  if (patch.type !== undefined) body.transaction_type = toBackendType(patch.type);

  const res = await apiClient.patch<RawTransaction>(`/transactions/${id}`, body);
  return toTransaction(res.data);
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
