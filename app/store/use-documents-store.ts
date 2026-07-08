import { create } from "zustand";
import {
  getDocuments,
  type DocumentRecord,
  type DocumentType,
  type ExtractedTransaction,
} from "@/lib/demo-transactions";
import { useTransactionsStore } from "@/store/use-transactions-store";

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

interface NewDocumentInput {
  name: string;
  type: DocumentType;
  uploadDate: string;
  sizeKb: number;
  bankName?: string;
}

interface DocumentsState {
  documents: DocumentRecord[];
  addDocuments: (documents: NewDocumentInput[]) => void;
  removeDocument: (id: string) => void;
  retryDocument: (id: string) => void;
  updateExtractedTransaction: (
    docId: string,
    txId: string,
    patch: Partial<Omit<ExtractedTransaction, "id">>,
  ) => void;
  approveDocument: (docId: string) => void;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => {
  function runProcessing(id: string) {
    setTimeout(() => {
      set((s) => ({
        documents: s.documents.map((d) =>
          d.id === id ? { ...d, status: "processing" } : d,
        ),
      }));

      setTimeout(() => {
        const doc = get().documents.find((d) => d.id === id);
        if (!doc) return;
        const succeeded = Math.random() > 0.15;
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id
              ? succeeded
                ? {
                    ...d,
                    status: "processed",
                    errorMessage: undefined,
                    extractedTransactions: generateExtractedTransactions(d.uploadDate),
                  }
                : {
                    ...d,
                    status: "failed",
                    errorMessage: "documentFailedGeneric",
                  }
              : d,
          ),
        }));
      }, 1600);
    }, 900);
  }

  return {
    documents: getDocuments(),
    addDocuments: (documents) => {
      const created = documents.map((d) => ({
        ...d,
        id: crypto.randomUUID(),
        status: "uploading" as const,
      }));
      set((s) => ({ documents: [...created, ...s.documents] }));
      for (const d of created) runProcessing(d.id);
    },
    removeDocument: (id) =>
      set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
    retryDocument: (id) => {
      set((s) => ({
        documents: s.documents.map((d) =>
          d.id === id ? { ...d, status: "uploading", errorMessage: undefined } : d,
        ),
      }));
      runProcessing(id);
    },
    updateExtractedTransaction: (docId, txId, patch) =>
      set((s) => ({
        documents: s.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                extractedTransactions: d.extractedTransactions?.map((tx) =>
                  tx.id === txId ? { ...tx, ...patch } : tx,
                ),
              }
            : d,
        ),
      })),
    approveDocument: (docId) => {
      const doc = get().documents.find((d) => d.id === docId);
      if (!doc?.extractedTransactions) return;
      const addTransaction = useTransactionsStore.getState().addTransaction;
      for (const tx of doc.extractedTransactions) {
        addTransaction({
          datetime: tx.datetime,
          title: tx.title,
          category: tx.category,
          type: tx.type,
          amount: tx.amount,
        });
      }
      set((s) => ({
        documents: s.documents.map((d) =>
          d.id === docId ? { ...d, approved: true, approvedAt: Date.now() } : d,
        ),
      }));
    },
  };
});
