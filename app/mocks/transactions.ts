import { delay } from "@/mocks/shared";
import type { Transaction } from "@/types/transaction";
import type { TransactionFilters, TransactionListResponse } from "@/api/transactions";

let transactions: Transaction[] = [
  {
    id: "t1",
    datetime: "2026-07-01T09:00:00",
    title: "Salary deposit",
    category: "Income",
    type: "income",
    amount: 42000,
  },
  {
    id: "t2",
    datetime: "2026-07-01T18:32:00",
    title: "Carrefour Market",
    category: "Groceries",
    type: "expense",
    amount: 650,
  },
  {
    id: "t3",
    datetime: "2026-06-29T13:05:00",
    title: "Uber ride",
    category: "Transport",
    type: "expense",
    amount: 120,
  },
  {
    id: "t4",
    datetime: "2026-06-28T21:10:00",
    title: "Cairo Kitchen restaurant",
    category: "Dining",
    type: "expense",
    amount: 380,
  },
  {
    id: "t5",
    datetime: "2026-06-27T08:15:00",
    title: "Electricity bill",
    category: "Utilities",
    type: "expense",
    amount: 540,
  },
  {
    id: "t6",
    datetime: "2026-06-26T11:40:00",
    title: "Freelance payment",
    category: "Income",
    type: "income",
    amount: 6500,
  },
  {
    id: "t7",
    datetime: "2026-06-25T16:20:00",
    title: "H&M",
    category: "Shopping",
    type: "expense",
    amount: 890,
  },
  {
    id: "t8",
    datetime: "2026-06-24T10:00:00",
    title: "Pharmacy",
    category: "Health",
    type: "expense",
    amount: 210,
  },
  {
    id: "t9",
    datetime: "2026-06-23T19:45:00",
    title: "Netflix subscription",
    category: "Shopping",
    type: "expense",
    amount: 150,
  },
  {
    id: "t10",
    datetime: "2026-06-22T07:30:00",
    title: "Gas station",
    category: "Transport",
    type: "expense",
    amount: 400,
  },
  {
    id: "t11",
    datetime: "2026-06-20T14:00:00",
    title: "Dividend payout",
    category: "Income",
    type: "income",
    amount: 1200,
  },
  {
    id: "t12",
    datetime: "2026-06-19T20:15:00",
    title: "Spinneys Market",
    category: "Groceries",
    type: "expense",
    amount: 720,
  },
  {
    id: "t13",
    datetime: "2026-06-18T12:30:00",
    title: "Dentist visit",
    category: "Health",
    type: "expense",
    amount: 950,
  },
  {
    id: "t14",
    datetime: "2026-06-17T09:00:00",
    title: "Water bill",
    category: "Utilities",
    type: "expense",
    amount: 180,
  },
  {
    id: "t15",
    datetime: "2026-06-15T15:50:00",
    title: "Cinema",
    category: "Dining",
    type: "expense",
    amount: 260,
  },
];

export function getTransactions(
  filters: TransactionFilters,
): Promise<TransactionListResponse> {
  const filtered = transactions.filter((tr) => {
    const matchesType = !filters.type || tr.type === filters.type;
    const matchesCategory = !filters.category || tr.category === filters.category;
    const q = filters.q?.trim().toLowerCase();
    const matchesSearch =
      !q || tr.title.toLowerCase().includes(q) || tr.category.toLowerCase().includes(q);
    const date = tr.datetime.slice(0, 10);
    const matchesDate =
      (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to);
    const matchesAmount =
      (filters.minAmount === undefined || tr.amount >= filters.minAmount) &&
      (filters.maxAmount === undefined || tr.amount <= filters.maxAmount);
    return (
      matchesType && matchesCategory && matchesSearch && matchesDate && matchesAmount
    );
  });
  const sorted = [...filtered].sort((a, b) =>
    filters.sort === "asc"
      ? a.datetime.localeCompare(b.datetime)
      : b.datetime.localeCompare(a.datetime),
  );
  const offset = filters.offset ?? 0;
  const limit = filters.limit ?? sorted.length;
  return delay({ items: sorted.slice(offset, offset + limit), total: sorted.length });
}

export function createTransaction(body: Omit<Transaction, "id">): Promise<Transaction> {
  const created: Transaction = { ...body, id: crypto.randomUUID() };
  transactions = [created, ...transactions];
  return delay(created);
}

export function updateTransaction(
  id: string,
  patch: Partial<Omit<Transaction, "id">>,
): Promise<Transaction> {
  transactions = transactions.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr));
  const updated = transactions.find((tr) => tr.id === id);
  if (!updated) throw new Error(`Transaction ${id} not found`);
  return delay(updated);
}

export function deleteTransaction(id: string): Promise<void> {
  transactions = transactions.filter((tr) => tr.id !== id);
  return delay(undefined);
}
