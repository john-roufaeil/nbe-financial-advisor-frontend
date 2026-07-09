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

let documents: DocumentRecord[] = [
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

function runProcessing(id: string) {
  setTimeout(() => {
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
                bankName:
                  d.bankName ?? BANK_CODES[Math.floor(Math.random() * BANK_CODES.length)],
                extractedTransactions: generateExtractedTransactions(d.uploadDate),
              }
            : { ...d, status: "failed", errorMessage: "documentFailedGeneric" }
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
    d.id === id ? { ...d, status: "uploading", errorMessage: undefined } : d,
  );
  runProcessing(id);
  const doc = documents.find((d) => d.id === id);
  if (!doc) return Promise.reject(new Error(`Document ${id} not found`));
  return delay(doc);
}

export function updateExtractedTransaction(
  documentId: string,
  transactionId: string,
  patch: Partial<Omit<ExtractedTransaction, "id">>,
): Promise<ExtractedTransaction> {
  documents = documents.map((d) =>
    d.id === documentId
      ? {
          ...d,
          extractedTransactions: d.extractedTransactions?.map((tx) =>
            tx.id === transactionId ? { ...tx, ...patch } : tx,
          ),
        }
      : d,
  );
  const updated = documents
    .find((d) => d.id === documentId)
    ?.extractedTransactions?.find((tx) => tx.id === transactionId);
  if (!updated) return Promise.reject(new Error("Extracted transaction not found"));
  return delay(updated, 150);
}

export function deleteExtractedTransaction(
  documentId: string,
  transactionId: string,
): Promise<void> {
  documents = documents.map((d) =>
    d.id === documentId
      ? {
          ...d,
          extractedTransactions: d.extractedTransactions?.filter(
            (tx) => tx.id !== transactionId,
          ),
        }
      : d,
  );
  return delay(undefined, 150);
}

export function addExtractedTransaction(
  documentId: string,
  body: Omit<ExtractedTransaction, "id">,
): Promise<ExtractedTransaction> {
  const created: ExtractedTransaction = { ...body, id: crypto.randomUUID() };
  documents = documents.map((d) =>
    d.id === documentId
      ? { ...d, extractedTransactions: [...(d.extractedTransactions ?? []), created] }
      : d,
  );
  return delay(created, 150);
}

export async function approveDocument(
  id: string,
): Promise<{ approvedAt: string; createdTransactionIds: string[] }> {
  const doc = documents.find((d) => d.id === id);
  if (!doc?.extractedTransactions) throw new Error(`Document ${id} not found`);
  const created = await Promise.all(
    doc.extractedTransactions.map((tx) =>
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
    d.id === id ? { ...d, approved: true, approvedAt: Date.now() } : d,
  );
  return delay({ approvedAt, createdTransactionIds: created.map((c) => c.id) });
}

export function deleteDocument(id: string): Promise<void> {
  documents = documents.filter((d) => d.id !== id);
  return delay(undefined);
}
