import { useEffect, useState } from "react";
import { useLocation } from "react-router";

/** Filters a dashboard drill-down (stat card, budget category) hands to the
 * transactions page via one-shot navigation state. */
export interface TxDrillFilters {
  type?: "income" | "expense";
  category?: string;
  from?: string;
  to?: string;
}

/**
 * Reads a one-shot `{ txFilters }` navigation state once per mount so the
 * transactions list opens pre-filtered, then wipes it from the history entry
 * (same pattern and rationale as useConsumeOpenAddState) so back/forward
 * navigation doesn't re-apply the drill-down over filters the user has since
 * changed.
 */
export function useConsumeTxFilterState(): TxDrillFilters | undefined {
  const location = useLocation();
  const [initial] = useState(
    () => (location.state as { txFilters?: TxDrillFilters } | null)?.txFilters,
  );

  useEffect(() => {
    if ((location.state as { txFilters?: TxDrillFilters } | null)?.txFilters) {
      window.history.replaceState(null, "", location.pathname);
    }
  }, [location]);

  return initial;
}
