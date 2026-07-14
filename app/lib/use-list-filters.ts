import { useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { usePageSizeStore } from "@/store/use-page-size-store";

/**
 * Filter/sort/pagination state shared by every filterable list (transactions,
 * bank statements): debounced search, a type filter, a from/to date range
 * that keeps itself ordered, date sort, and pagination — with every updater
 * also resetting the page back to 1.
 *
 * Lists with extra filters (e.g. the transactions tab's category and amount
 * range) layer them on top and fold them into `hasActiveFilters` /
 * `clearAllFilters` themselves.
 */
export function useListFilters<F extends string>(defaultFilter: F) {
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 1000);
  const [filter, setFilter] = useState<F>(defaultFilter);
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
  function updateFilter(value: F) {
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
    searchInput !== "" || filter !== defaultFilter || fromDate !== "" || toDate !== "";

  function clearAllFilters() {
    setSearchInput("");
    setFilter(defaultFilter);
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  return {
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
