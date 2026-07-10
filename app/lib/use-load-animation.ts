import { useRef } from "react";

/**
 * Picks the entry animation for a dynamic-data component based on whether it had
 * to show a loading state this mount:
 *  - Fetched fresh (a skeleton showed first) → fade in without movement, so the
 *    data settles in place instead of re-sliding after the skeleton already slid.
 *  - Already cached (rendered straight to data, e.g. navigating back) → fade in
 *    with movement, matching how static content enters.
 *
 * Pass the query's `isPending`/`isLoading`. Returns the class for the LOADED view.
 */
export function useLoadAnimation(isLoading: boolean): string {
  const showedLoader = useRef(false);
  if (isLoading) showedLoader.current = true;
  return showedLoader.current ? "animate-fade-in" : "animate-entry";
}
