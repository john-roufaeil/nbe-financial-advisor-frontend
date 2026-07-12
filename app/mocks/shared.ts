import { MOCK_LATENCY_MS } from "@/lib/constants/time";

/** Simulated network latency so mock-mode loading states are visible instead of resolving instantly. */
export function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
