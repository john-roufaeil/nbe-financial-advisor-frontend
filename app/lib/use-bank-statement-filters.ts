import { useListFilters } from "@/lib/use-list-filters";

const FILTERS = ["all", "pdf", "image", "doc"] as const;
export type BankStatementFilter = (typeof FILTERS)[number];

/** All filter/sort/pagination state for the bank statements list, plus the
 * updater functions that also reset the page back to 1 on any filter change. */
export function useBankStatementFilters() {
  return { FILTERS, ...useListFilters<BankStatementFilter>("all") };
}
