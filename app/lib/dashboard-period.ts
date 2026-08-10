import type { DashboardPeriod } from "@/types/dashboard";

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * The inclusive from/to date range (local time, "YYYY-MM-DD") a dashboard
 * period covers. Shared by the drill-down links into the transactions page
 * and the dashboard summary request, so what a stat card shows and what its
 * drill-down lists always agree on the window.
 */
export function dashboardPeriodRange(period: DashboardPeriod): {
  from: string;
  to: string;
} {
  const now = new Date();
  switch (period) {
    case "thisMonth":
      return {
        from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: toIsoDate(now),
      };
    case "lastMonth":
      return {
        from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        // Day 0 of the current month = the last day of the previous month.
        to: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "last3Months":
      return {
        from: toIsoDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
        to: toIsoDate(now),
      };
    case "thisYear":
      return {
        from: toIsoDate(new Date(now.getFullYear(), 0, 1)),
        to: toIsoDate(now),
      };
  }
}
