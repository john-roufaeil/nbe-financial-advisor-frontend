import { delay } from "@/mocks/shared";
import { createTransaction } from "@/mocks/transactions";
import { getAccounts, createAccount } from "@/mocks/accounts";
import { BANK_CODES } from "@/lib/banks";
import type {
  BankStatementFilters,
  BankStatementListResponse,
} from "@/api/bank-statements";
import type {
  BankStatement,
  BankStatementType,
  ExtractedTransaction,
} from "@/types/bank-statement";

const SAMPLE_POOL: Omit<ExtractedTransaction, "id" | "datetime">[] = [
  { title: "Grocery purchase", category: "food", type: "expense", amount: 340 },
  { title: "Restaurant charge", category: "food", type: "expense", amount: 210 },
  { title: "Incoming transfer", category: "other", type: "income", amount: 1500 },
  { title: "Utility payment", category: "housing", type: "expense", amount: 180 },
  { title: "Online purchase", category: "lifestyle", type: "expense", amount: 95 },
  { title: "Ride share", category: "transport", type: "expense", amount: 65 },
];

/**
 * Simulates OCR reading an account number off the statement, then mirrors the
 * backend's `_finalize_normalization_phase()`: it resolves that number against
 * the user's accounts with a get-or-create, so a never-seen number gets a new
 * BankAccount right here — before the user ever reaches the confirm-account
 * step. Most of the time it "reads" an existing account (so step 1 can demo
 * the auto-match path); the rest of the time it's a fresh number, which is
 * exactly the case that creates a new account mid-processing.
 *
 * Full numbers, not last-4 — the real normalizer returns the account number as
 * printed on the statement (services/ai_service.py's normalized_json contract).
 */
async function resolveAccountForStatement(
  fallbackBankName?: string,
): Promise<{ perceivedAccountNumber: string; accountId: string; bankName: string }> {
  const existing = await getAccounts();
  if (existing.length > 0 && Math.random() > 0.3) {
    const pick = existing[Math.floor(Math.random() * existing.length)];
    return {
      perceivedAccountNumber: pick.masked_account_number,
      accountId: pick.id,
      bankName: pick.bank_name,
    };
  }
  const perceivedAccountNumber = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  const bankName =
    fallbackBankName ?? BANK_CODES[Math.floor(Math.random() * BANK_CODES.length)];
  const created = await createAccount({
    bank_name: bankName,
    account_type: "checking",
    masked_account_number: perceivedAccountNumber,
    currency: "EGP",
  });
  return { perceivedAccountNumber, accountId: created.id, bankName };
}

function generateExtractedTransactions(uploadDate: string): ExtractedTransaction[] {
  const count = 2 + Math.floor(Math.random() * 3);
  const picks = [...SAMPLE_POOL].sort(() => Math.random() - 0.5).slice(0, count);
  return picks.map((p) => ({
    ...p,
    id: crypto.randomUUID(),
    datetime: `${uploadDate}T00:00:00`,
  }));
}

const SEED_DOCS: BankStatement[] = [
  {
    id: "d1",
    name: "Bank Statement - June 2026.pdf",
    type: "pdf",
    uploadDate: "2026-07-02",
    sizeKb: 245,
    status: "processed",
    approved: true,
    bankName: "NBE",
  },
  {
    id: "d2",
    name: "Bank Statement - March 2026.jpg",
    type: "image",
    uploadDate: "2026-05-10",
    sizeKb: 1320,
    status: "processed",
    approved: true,
  },
  {
    id: "d3",
    name: "Bank Statement - February 2026.docx",
    type: "doc",
    uploadDate: "2026-04-22",
    sizeKb: 88,
    status: "processed",
    approved: true,
  },
  {
    id: "d4",
    name: "Bank Statement - May 2026.pdf",
    type: "pdf",
    uploadDate: "2026-06-02",
    sizeKb: 231,
    status: "processed",
    approved: true,
    bankName: "CIB",
  },
  {
    id: "d5",
    name: "Bank Statement - January 2026.pdf",
    type: "pdf",
    uploadDate: "2026-06-27",
    sizeKb: 96,
    status: "processed",
    approved: true,
  },
  {
    id: "d6",
    name: "Bank Statement - December 2025.png",
    type: "image",
    uploadDate: "2026-03-15",
    sizeKb: 980,
    status: "processed",
    approved: true,
  },
  {
    id: "d7",
    name: "Bank Statement - November 2025.docx",
    type: "doc",
    uploadDate: "2026-02-01",
    sizeKb: 156,
    status: "processed",
    approved: true,
  },
  {
    id: "d8",
    name: "Bank Statement - April 2026.pdf",
    type: "pdf",
    uploadDate: "2026-05-03",
    sizeKb: 228,
    status: "processed",
    approved: true,
    bankName: "BM",
  },
];

let bankStatements: BankStatement[] = SEED_DOCS.map((doc) => ({
  ...doc,
  accountConfirmed: true,
  extractedTransactions: generateExtractedTransactions(doc.uploadDate),
}));

function runProcessing(id: string) {
  setTimeout(() => {
    // The upload itself can fail before processing ever starts — the file never
    // lands, so recovery means picking the file again, not a retry.
    const uploaded = Math.random() > 0.1;
    if (!uploaded) {
      bankStatements = bankStatements.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "failed",
              failedStage: "upload",
              errorMessage: "uploadFailedGeneric",
            }
          : d,
      );
      return;
    }

    bankStatements = bankStatements.map((d) =>
      d.id === id ? { ...d, status: "processing" } : d,
    );

    setTimeout(async () => {
      const doc = bankStatements.find((d) => d.id === id);
      if (!doc) return;
      const succeeded = Math.random() > 0.15;
      const resolved = succeeded
        ? await resolveAccountForStatement(doc.bankName)
        : undefined;
      bankStatements = bankStatements.map((d) =>
        d.id === id
          ? succeeded && resolved
            ? {
                ...d,
                status: "processed",
                errorMessage: undefined,
                failedStage: undefined,
                bankName: resolved.bankName,
                accountId: resolved.accountId,
                extractedTransactions: generateExtractedTransactions(d.uploadDate),
                perceivedAccountNumber: resolved.perceivedAccountNumber,
                accountConfirmed: false,
              }
            : {
                ...d,
                status: "failed",
                failedStage: "processing",
                errorMessage: "bankStatementFailedGeneric",
              }
          : d,
      );
    }, 1600);
  }, 900);
}

export function getBankStatements(
  filters: BankStatementFilters,
): Promise<BankStatementListResponse> {
  const filtered = bankStatements.filter((doc) => {
    const matchesType = !filters.type || doc.type === filters.type;
    const q = filters.q?.trim().toLowerCase();
    const matchesSearch = !q || (doc.name ?? "").toLowerCase().includes(q);
    const matchesDate =
      (!filters.from || doc.uploadDate >= filters.from) &&
      (!filters.to || doc.uploadDate <= filters.to);
    return matchesType && matchesSearch && matchesDate;
  });
  filtered.sort((a, b) =>
    filters.sort === "asc"
      ? a.uploadDate.localeCompare(b.uploadDate)
      : b.uploadDate.localeCompare(a.uploadDate),
  );
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? filtered.length;
  return delay({ items: filtered.slice(offset, offset + limit), total: filtered.length });
}

export function getBankStatement(id: string): Promise<BankStatement> {
  const doc = bankStatements.find((d) => d.id === id);
  if (!doc) return Promise.reject(new Error(`Bank statement ${id} not found`));
  // Mock mode keeps the full review flow: rows stay editable and addable until
  // the user approves, at which point they're committed and become read-only.
  return delay(
    { ...doc, canEditTransactions: !doc.approved, canAddTransactions: !doc.approved },
    150,
  );
}

export function uploadBankStatements(
  files: { name: string; type: BankStatementType; sizeKb: number }[],
): Promise<BankStatement[]> {
  const uploadDate = new Date().toISOString().slice(0, 10);
  const created = files.map((f): BankStatement => ({
    id: crypto.randomUUID(),
    name: f.name,
    type: f.type,
    uploadDate,
    sizeKb: f.sizeKb,
    status: "uploading",
  }));
  bankStatements = [...created, ...bankStatements];
  for (const d of created) runProcessing(d.id);
  return delay(created);
}

export function retryBankStatement(id: string): Promise<BankStatement> {
  bankStatements = bankStatements.map((d) =>
    d.id === id
      ? { ...d, status: "uploading", errorMessage: undefined, failedStage: undefined }
      : d,
  );
  runProcessing(id);
  const doc = bankStatements.find((d) => d.id === id);
  if (!doc) return Promise.reject(new Error(`Bank statement ${id} not found`));
  return delay(doc);
}

/**
 * Rows are edited/added/removed purely client-side while under review (see
 * BankStatementDetailModal) — the edited list only reaches the mock store here,
 * in one shot, when the user approves. The confirmed account arrives the same
 * way: like the real API, this is the only call that accepts one.
 */
export async function approveBankStatement(
  id: string,
  transactions: ExtractedTransaction[],
  accountId?: string,
): Promise<{ approvedAt: string; createdTransactionIds: string[] }> {
  const doc = bankStatements.find((d) => d.id === id);
  if (!doc) throw new Error(`Bank statement ${id} not found`);
  const created = await Promise.all(
    transactions.map((tx) =>
      createTransaction({
        datetime: tx.datetime,
        title: tx.title,
        category: tx.category,
        type: tx.type,
        amount: tx.amount,
        source: "synchronized",
      }),
    ),
  );
  const approvedAt = new Date().toISOString();
  bankStatements = bankStatements.map((d) =>
    d.id === id
      ? {
          ...d,
          approved: true,
          approvedAt: Date.now(),
          extractedTransactions: transactions,
          accountId: accountId ?? d.accountId,
          accountConfirmed: true,
        }
      : d,
  );
  return delay({ approvedAt, createdTransactionIds: created.map((c) => c.id) });
}

export function deleteBankStatement(id: string): Promise<void> {
  bankStatements = bankStatements.filter((d) => d.id !== id);
  return delay(undefined);
}
