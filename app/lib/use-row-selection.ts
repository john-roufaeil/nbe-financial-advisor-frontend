import { useEffect, useState } from "react";

/**
 * Selection state for a paged list's checkboxes. `resetKey` should change
 * whenever the current page's row identity changes (page number, filters,
 * page size) so a stale selection never survives onto a different set of
 * rows — selection is page-scoped, not "select all across every page".
 */
export function useRowSelection(resetKey: string) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelected(new Set());
  }, [resetKey]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll(ids: string[]) {
    setSelected(new Set(ids));
  }

  function clear() {
    setSelected(new Set());
  }

  return { selected, toggle, selectAll, clear };
}
