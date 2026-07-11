import { delay } from "@/mocks/shared";
import { createTransaction } from "@/mocks/transactions";
import { BANK_CODES } from "@/lib/banks";
import type { DocumentFilters, DocumentListResponse } from "@/api/documents";
import type {
  DocumentRecord,
  DocumentType,
  ExtractedTransaction,
} from "@/types/document";

const SAMPLE_POOL: Omit<ExtractedTransaction, "id" | "datetime">[] = [
  { title: "Grocery purchase", category: "Groceries", type: "expense", amount: 340 },
  { title: "Restaurant charge", category: "Dining", type: "expense", amount: 210 },
  { title: "Incoming transfer", category: "Income", type: "income", amount: 1500 },
  { title: "Utility payment", category: "Utilities", type: "expense", amount: 180 },
  { title: "Online purchase", category: "Shopping", type: "expense", amount: 95 },
  { title: "Ride share", category: "Transport", type: "expense", amount: 65 },
];

function generateExtractedTransactions(uploadDate: string): ExtractedTransaction[] {
  const count = 2 + Math.floor(Math.random() * 3);
  const picks = [...SAMPLE_POOL].sort(() => Math.random() - 0.5).slice(0, count);
  return picks.map((p) => ({
    ...p,
    id: crypto.randomUUID(),
    datetime: `${uploadDate}T00:00:00`,
  }));
}

const SEED_DOCS: DocumentRecord[] = [
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

let documents: DocumentRecord[] = SEED_DOCS.map((doc) => ({
  ...doc,
  extractedTransactions: generateExtractedTransactions(doc.uploadDate),
}));

function runProcessing(id: string) {
  setTimeout(() => {
    // The upload itself can fail before processing ever starts — the file never
    // lands, so recovery means picking the file again, not a retry.
    const uploaded = Math.random() > 0.1;
    if (!uploaded) {
      documents = documents.map((d) =>
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

    documents = documents.map((d) => (d.id === id ? { ...d, status: "processing" } : d));

    setTimeout(() => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const succeeded = Math.random() > 0.15;
      documents = documents.map((d) =>
        d.id === id
          ? succeeded
            ? {
                ...d,
                status: "processed",
                errorMessage: undefined,
                failedStage: undefined,
                bankName:
                  d.bankName ?? BANK_CODES[Math.floor(Math.random() * BANK_CODES.length)],
                extractedTransactions: generateExtractedTransactions(d.uploadDate),
              }
            : {
                ...d,
                status: "failed",
                failedStage: "processing",
                errorMessage: "documentFailedGeneric",
              }
          : d,
      );
    }, 1600);
  }, 900);
}

export function getDocuments(filters: DocumentFilters): Promise<DocumentListResponse> {
  const filtered = documents.filter((doc) => {
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

export function getDocument(id: string): Promise<DocumentRecord> {
  const doc = documents.find((d) => d.id === id);
  if (!doc) return Promise.reject(new Error(`Document ${id} not found`));
  // Mock mode keeps the full review flow: rows stay editable and addable until
  // the user approves, at which point they're committed and become read-only.
  return delay(
    { ...doc, canEditTransactions: !doc.approved, canAddTransactions: !doc.approved },
    150,
  );
}

export function uploadDocuments(
  files: { name: string; type: DocumentType; sizeKb: number }[],
): Promise<DocumentRecord[]> {
  const uploadDate = new Date().toISOString().slice(0, 10);
  const created = files.map((f): DocumentRecord => ({
    id: crypto.randomUUID(),
    name: f.name,
    type: f.type,
    uploadDate,
    sizeKb: f.sizeKb,
    status: "uploading",
  }));
  documents = [...created, ...documents];
  for (const d of created) runProcessing(d.id);
  return delay(created);
}

export function retryDocument(id: string): Promise<DocumentRecord> {
  documents = documents.map((d) =>
    d.id === id
      ? { ...d, status: "uploading", errorMessage: undefined, failedStage: undefined }
      : d,
  );
  runProcessing(id);
  const doc = documents.find((d) => d.id === id);
  if (!doc) return Promise.reject(new Error(`Document ${id} not found`));
  return delay(doc);
}

/**
 * Rows are edited/added/removed purely client-side while under review (see
 * DocumentDetailModal) — the edited list only reaches the mock store here,
 * in one shot, when the user approves.
 */
export async function approveDocument(
  id: string,
  transactions: ExtractedTransaction[],
): Promise<{ approvedAt: string; createdTransactionIds: string[] }> {
  const doc = documents.find((d) => d.id === id);
  if (!doc) throw new Error(`Document ${id} not found`);
  const created = await Promise.all(
    transactions.map((tx) =>
      createTransaction({
        datetime: tx.datetime,
        title: tx.title,
        category: tx.category,
        type: tx.type,
        amount: tx.amount,
      }),
    ),
  );
  const approvedAt = new Date().toISOString();
  documents = documents.map((d) =>
    d.id === id
      ? {
          ...d,
          approved: true,
          approvedAt: Date.now(),
          extractedTransactions: transactions,
        }
      : d,
  );
  return delay({ approvedAt, createdTransactionIds: created.map((c) => c.id) });
}

export function deleteDocument(id: string): Promise<void> {
  documents = documents.filter((d) => d.id !== id);
  return delay(undefined);
}
