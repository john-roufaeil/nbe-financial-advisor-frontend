import { useCallback, useEffect, useRef } from "react";

const INITIAL_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 80;

/**
 * Press-and-hold auto-repeat for a spinner button. Used by MoneyInput's and
 * SliderField's +/- steppers. Purely additive to an existing `onClick`
 * handler — a normal tap never reaches the initial delay,
 * so `onClick` alone still handles it (no double-fire); holding past the
 * delay starts firing `onStep` on an interval until released.
 *
 * `onStep` is read via a ref refreshed every render, not captured once at
 * press-start, so each repeat calls the latest closure (current value/bounds)
 * instead of replaying whatever was current when the hold began.
 */
export function useHoldRepeat(onStep: () => void) {
  const onStepRef = useRef(onStep);
  useEffect(() => {
    onStepRef.current = onStep;
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const start = useCallback(() => {
    stop();
    timeoutRef.current = setTimeout(() => {
      onStepRef.current();
      intervalRef.current = setInterval(() => onStepRef.current(), REPEAT_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}
