import { useState } from "react";
import { useListFilters } from "@/lib/use-list-filters";
import { BANK_STATEMENT_RAW_STATUSES } from "@/types/bank-statement";

const FILTERS = ["all", ...BANK_STATEMENT_RAW_STATUSES] as const;
export type BankStatementFilter = (typeof FILTERS)[number];

/** All filter/sort/pagination state for the bank statements list, plus the
 * updater functions that also reset the page back to 1 on any filter change.
 * Extends the shared list filters with an account filter. */
export function useBankStatementFilters() {
  const base = useListFilters<BankStatementFilter>("all");
  const [account, setAccount] = useState("");

  function updateAccount(value: string) {
    setAccount(value);
    base.setPage(1);
  }
  function clearAllFilters() {
    base.clearAllFilters();
    setAccount("");
  }

  return {
    FILTERS,
    ...base,
    account,
    updateAccount,
    hasActiveFilters: base.hasActiveFilters || account !== "",
    clearAllFilters,
  };
}
