import { useEffect, useState } from "react";
import { useCategoriesForType } from "@/queries/categories";
import type { BankStatement, ExtractedTransaction } from "@/types/bank-statement";

/**
 * Client-side draft of a statement's extracted transactions — edited entirely
 * in local state while under review, since the only request the review modal
 * ever sends is the final approve call with this draft attached. Resynced
 * whenever a different statement is opened.
 */
export function useExtractedTransactionsDraft(doc: BankStatement | undefined) {
  const [draft, setDraft] = useState<ExtractedTransaction[]>([]);
  const expenseCategories = useCategoriesForType("expense");

  useEffect(() => {
    setDraft(doc?.extractedTransactions ?? []);
  }, [doc?.id, doc?.status, doc?.extractedTransactions]);

  function updateDraftTransaction(
    txId: string,
    patch: Partial<Omit<ExtractedTransaction, "id">>,
  ) {
    setDraft((d) => d.map((tx) => (tx.id === txId ? { ...tx, ...patch } : tx)));
  }

  function deleteDraftTransaction(txId: string) {
    setDraft((d) => d.filter((tx) => tx.id !== txId));
  }

  function addDraftTransaction() {
    if (!doc) return;
    setDraft((d) => [
      ...d,
      {
        id: crypto.randomUUID(),
        datetime: `${doc.uploadDate.slice(0, 10)}T00:00:00`,
        title: "",
        // "other" is the backend's guaranteed expense fallback bucket, so a
        // fresh row stays valid even if the taxonomy hasn't loaded yet.
        category: expenseCategories[0]?.name ?? "other",
        type: "expense",
        amount: 0,
      },
    ]);
  }

  return { draft, updateDraftTransaction, deleteDraftTransaction, addDraftTransaction };
}
