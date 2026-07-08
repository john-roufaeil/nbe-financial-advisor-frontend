import { create } from "zustand";
import { getTransactions, type Transaction } from "@/lib/demo-transactions";

interface TransactionsState {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, "id">>) => void;
  removeTransaction: (id: string) => void;
}

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: getTransactions(),
  addTransaction: (transaction) =>
    set((s) => ({
      transactions: [{ ...transaction, id: crypto.randomUUID() }, ...s.transactions],
    })),
  updateTransaction: (id, patch) =>
    set((s) => ({
      transactions: s.transactions.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr)),
    })),
  removeTransaction: (id) =>
    set((s) => ({ transactions: s.transactions.filter((tr) => tr.id !== id) })),
}));
