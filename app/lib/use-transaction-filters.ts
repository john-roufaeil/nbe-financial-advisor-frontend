import { useState } from "react";
import { AMOUNT_RANGES } from "@/types/transaction";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { usePageSizeStore } from "@/store/use-page-size-store";

const FILTERS = ["all", "income", "expense"] as const;
export type TransactionFilter = (typeof FILTERS)[number];

/** All filter/sort/pagination state for the transactions list, plus the
 * updater functions that also reset the page back to 1 on any filter change. */
export function useTransactionFilters() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 1000);
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [amountRange, setAmountRange] = useState("any");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = usePageSizeStore((s) => s.pageSize);
  const setPageSize = usePageSizeStore((s) => s.setPageSize);

  const selectedAmountRange = AMOUNT_RANGES.find((r) => r.key === amountRange);

  function updatePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }
  function updateSearch(value: string) {
    setSearchInput(value);
    setPage(1);
  }
  function updateFilter(value: TransactionFilter) {
    setFilter(value);
    setPage(1);
  }
  function updateCategory(value: string) {
    setCategory(value);
    setPage(1);
  }
  function updateFromDate(value: string) {
    setFromDate(value);
    if (toDate && value > toDate) setToDate(value);
    setPage(1);
  }
  function updateToDate(value: string) {
    setToDate(value);
    if (fromDate && value < fromDate) setFromDate(value);
    setPage(1);
  }
  function updateAmountRange(value: string) {
    setAmountRange(value);
    setPage(1);
  }

  const hasActiveFilters =
    searchInput !== "" ||
    filter !== "all" ||
    category !== "" ||
    fromDate !== "" ||
    toDate !== "" ||
    amountRange !== "any";

  function clearAllFilters() {
    setSearchInput("");
    setFilter("all");
    setCategory("");
    setFromDate("");
    setToDate("");
    setAmountRange("any");
    setPage(1);
  }

  return {
    FILTERS,
    searchInput,
    search,
    updateSearch,
    filter,
    updateFilter,
    category,
    updateCategory,
    fromDate,
    updateFromDate,
    toDate,
    updateToDate,
    amountRange,
    updateAmountRange,
    selectedAmountRange,
    sort,
    setSort,
    page,
    setPage,
    pageSize,
    updatePageSize,
    hasActiveFilters,
    clearAllFilters,
  };
}
