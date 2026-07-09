/** Simulated network latency so mock-mode loading states are visible instead of resolving instantly. */
export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
