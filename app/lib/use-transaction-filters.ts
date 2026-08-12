import { useState } from "react";
import { useListFilters } from "@/lib/use-list-filters";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const FILTERS = ["all", "income", "expense"] as const;
export type TransactionFilter = (typeof FILTERS)[number];

/** All filter/sort/pagination state for the transactions list, plus the
 * updater functions that also reset the page back to 1 on any filter change.
 * Extends the shared list filters with category, account, source, recurring,
 * and amount-range filters. */
export function useTransactionFilters(initial?: {
  filter?: TransactionFilter;
  category?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const base = useListFilters<TransactionFilter>("all", initial);
  const [category, setCategory] = useState(initial?.category ?? "");
  const [account, setAccount] = useState("");
  const [source, setSource] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [amountMinInput, setAmountMinInput] = useState<number | "">("");
  const [amountMaxInput, setAmountMaxInput] = useState<number | "">("");
  // Debounced like search, so dragging the slider or typing a value doesn't
  // fire a request per intermediate step.
  const amountMin = useDebouncedValue(amountMinInput);
  const amountMax = useDebouncedValue(amountMaxInput);

  function updateCategory(value: string) {
    setCategory(value);
    base.setPage(1);
  }
  function updateAccount(value: string) {
    setAccount(value);
    base.setPage(1);
  }
  function updateSource(value: string) {
    setSource(value);
    base.setPage(1);
  }
  function updateIsRecurring(value: boolean) {
    setIsRecurring(value);
    base.setPage(1);
  }
  // Keeps min/max ordered the same way useListFilters keeps fromDate/toDate
  // ordered — moving one bound past the other drags it along instead of
  // leaving an inverted (and meaningless) range.
  function updateAmountMin(value: number | "") {
    setAmountMinInput(value);
    if (value !== "" && amountMaxInput !== "" && value > amountMaxInput) {
      setAmountMaxInput(value);
    }
    base.setPage(1);
  }
  function updateAmountMax(value: number | "") {
    setAmountMaxInput(value);
    if (value !== "" && amountMinInput !== "" && value < amountMinInput) {
      setAmountMinInput(value);
    }
    base.setPage(1);
  }
  function clearAllFilters() {
    base.clearAllFilters();
    setCategory("");
    setAccount("");
    setSource("");
    setIsRecurring(false);
    setAmountMinInput("");
    setAmountMaxInput("");
  }

  return {
    FILTERS,
    ...base,
    category,
    updateCategory,
    account,
    updateAccount,
    source,
    updateSource,
    isRecurring,
    updateIsRecurring,
    amountMinInput,
    amountMaxInput,
    updateAmountMin,
    updateAmountMax,
    amountMin: amountMin === "" ? undefined : amountMin,
    amountMax: amountMax === "" ? undefined : amountMax,
    hasActiveFilters:
      base.hasActiveFilters ||
      category !== "" ||
      account !== "" ||
      source !== "" ||
      isRecurring ||
      amountMinInput !== "" ||
      amountMaxInput !== "",
    clearAllFilters,
  };
}
