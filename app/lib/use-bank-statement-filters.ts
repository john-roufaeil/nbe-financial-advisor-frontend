import { useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { usePageSizeStore } from "@/store/use-page-size-store";

const FILTERS = ["all", "pdf", "image", "doc"] as const;
export type BankStatementFilter = (typeof FILTERS)[number];

/** All filter/sort/pagination state for the bank statements list, plus the
 * updater functions that also reset the page back to 1 on any filter change. */
export function useBankStatementFilters() {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 1000);
  const [filter, setFilter] = useState<BankStatementFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = usePageSizeStore((s) => s.pageSize);
  const setPageSize = usePageSizeStore((s) => s.setPageSize);

  function updatePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }
  function updateSearch(value: string) {
    setSearchInput(value);
    setPage(1);
  }
  function updateFilter(value: BankStatementFilter) {
    setFilter(value);
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

  const hasActiveFilters =
    searchInput !== "" || filter !== "all" || fromDate !== "" || toDate !== "";

  function clearAllFilters() {
    setSearchInput("");
    setFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return {
    FILTERS,
    searchInput,
    search,
    updateSearch,
    filter,
    updateFilter,
    fromDate,
    updateFromDate,
    toDate,
    updateToDate,
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
