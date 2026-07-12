import { useCallback } from "react";
import { formatNumber } from "@/lib/format";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";

/**
 * Binds formatNumber to the user's number-format + compact-numbers
 * preferences, for display call sites. Pass `disableCompact` for detail
 * views where the exact figure matters more than a short label (e.g. a
 * transaction detail modal), regardless of the compact-numbers preference.
 */
export function useNumberDisplay(disableCompact = false) {
  const separator = useDisplayPreferencesStore((s) => s.numberFormat);
  const compactPreference = useDisplayPreferencesStore((s) => s.compactNumbers);
  const compact = disableCompact ? false : compactPreference;
  return useCallback(
    (value: number) => formatNumber(value, { separator, compact }),
    [separator, compact],
  );
}
