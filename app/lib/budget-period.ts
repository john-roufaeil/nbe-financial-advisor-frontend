/** YYYY-MM period helpers shared by every budget-page section that's period-aware. */

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function previousPeriod(period: string = currentPeriod()): string {
  const [year, month] = period.split("-").map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Oldest -> newest, ending at `period` (defaults to the current month). */
export function lastPeriods(
  count: number,
  endPeriod: string = currentPeriod(),
): string[] {
  const [year, month] = endPeriod.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(year, month - 1 - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}
