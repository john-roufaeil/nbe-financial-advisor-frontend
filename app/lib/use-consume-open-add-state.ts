import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * Consumes a one-shot `{ openAdd: true }` navigation state (set when linking
 * in from elsewhere, e.g. the dashboard's "add" shortcuts) by calling `open`
 * once per mount. Guards against firing twice for the same mount (e.g. dev
 * double-effects) and against a stray re-render seeing the not-yet-cleared
 * state again.
 */
export function useConsumeOpenAddState(open: () => void) {
  const location = useLocation();
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    if ((location.state as { openAdd?: boolean } | null)?.openAdd) {
      consumed.current = true;
      open();
      // Clear via the raw history API (not react-router's navigate) so the
      // one-shot intent is wiped from this entry synchronously and
      // unconditionally — it doesn't depend on the router's navigation queue,
      // so it can't be skipped or lingered on, which would otherwise reopen
      // the modal on a later back/forward navigation to this entry.
      window.history.replaceState(null, "", location.pathname);
    }
  }, [location]);
}
