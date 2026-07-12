import { useEffect, useState } from "react";
import { TRANSACTION_CATEGORIES } from "@/types/transaction";
import type { BankStatement, ExtractedTransaction } from "@/types/bank-statement";

/**
 * Client-side draft of a statement's extracted transactions — edited entirely
 * in local state while under review, since the only request the review modal
 * ever sends is the final approve call with this draft attached. Resynced
 * whenever a different statement is opened.
 */
export function useExtractedTransactionsDraft(doc: BankStatement | undefined) {
  const [draft, setDraft] = useState<ExtractedTransaction[]>([]);

  useEffect(() => {
    setDraft(doc?.extractedTransactions ?? []);
  }, [doc?.id]);

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
        category: TRANSACTION_CATEGORIES[0],
        type: "expense",
        amount: 0,
      },
    ]);
  }

  return { draft, updateDraftTransaction, deleteDraftTransaction, addDraftTransaction };
}
