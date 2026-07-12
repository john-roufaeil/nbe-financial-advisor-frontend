import { useEffect, useState } from "react";
import { DEBOUNCE_DELAY_MS } from "@/lib/constants/time";

/** Delays reflecting `value` until it stops changing for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs = DEBOUNCE_DELAY_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
