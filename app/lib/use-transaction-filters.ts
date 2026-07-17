import { useState } from "react";
import { AMOUNT_RANGES } from "@/types/transaction";
import { useListFilters } from "@/lib/use-list-filters";

const FILTERS = ["all", "income", "expense"] as const;
export type TransactionFilter = (typeof FILTERS)[number];

/** All filter/sort/pagination state for the transactions list, plus the
 * updater functions that also reset the page back to 1 on any filter change.
 * Extends the shared list filters with category and amount-range filters. */
export function useTransactionFilters(initial?: {
  filter?: TransactionFilter;
  category?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const base = useListFilters<TransactionFilter>("all", initial);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [amountRange, setAmountRange] = useState("any");

  const selectedAmountRange = AMOUNT_RANGES.find((r) => r.key === amountRange);

  function updateCategory(value: string) {
    setCategory(value);
    base.setPage(1);
  }
  function updateAmountRange(value: string) {
    setAmountRange(value);
    base.setPage(1);
  }
  function clearAllFilters() {
    base.clearAllFilters();
    setCategory("");
    setAmountRange("any");
  }

  return {
    FILTERS,
    ...base,
    category,
    updateCategory,
    amountRange,
    updateAmountRange,
    selectedAmountRange,
    hasActiveFilters: base.hasActiveFilters || category !== "" || amountRange !== "any",
    clearAllFilters,
  };
}
