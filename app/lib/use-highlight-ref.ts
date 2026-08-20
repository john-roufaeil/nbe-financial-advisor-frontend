import { useEffect, useRef } from "react";

/**
 * Ref for a field's wrapping element that scrolls it into view the moment
 * `active` turns true — used by the onboarding steps to jump to (and, via
 * the caller's own ring styling, visually flag) a field the user picked
 * from PlanSummary's "edit" affordance.
 */
export function useHighlightRef<T extends HTMLElement>(
  active: boolean | null | undefined,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);
  return ref;
}
