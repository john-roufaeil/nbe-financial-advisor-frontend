import { delay } from "@/mocks/shared";
import type {
  DashboardFilters,
  DashboardPeriod,
  DashboardSummary,
} from "@/types/dashboard";

// How much bigger each window's flow totals are than a single month's, so
// switching the period filter visibly rescales the mock numbers.
const PERIOD_SCALE: Record<DashboardPeriod, number> = {
  thisMonth: 1,
  lastMonth: 0.92,
  last3Months: 2.9,
  thisYear: 6.4,
};

// The two mock accounts' share of every flow (matches app/mocks/accounts.ts).
const ACCOUNT_SHARE: Record<string, number> = {
  "acc-nbe-1": 0.67,
  "acc-cib-1": 0.33,
};

export function getDashboardSummary(
  filters: DashboardFilters,
): Promise<DashboardSummary> {
  const scale = PERIOD_SCALE[filters.period];
  const share = filters.accountId ? (ACCOUNT_SHARE[filters.accountId] ?? 0.5) : 1;
  const flow = (value: number) => Math.round(value * scale * share);

  return delay({
    currency: "EGP",
    hasPlan: true,
    stats: [
      // Balance is a point-in-time value: the account filter carves it up,
      // but the period only nudges it (an older as-of date, not a sum).
      {
        key: "balance",
        value: Math.round(128450 * share * (filters.period === "lastMonth" ? 0.96 : 1)),
        deltaPct: 4.2,
        goodDirection: "up",
      },
      { key: "income", value: flow(42000), deltaPct: 1.5, goodDirection: "up" },
      { key: "spending", value: flow(27860), deltaPct: -6.3, goodDirection: "down" },
      { key: "savingsRate", value: 34, deltaPct: 2, goodDirection: "up" },
    ],
    budget: {
      categories: [
        { name: "food", budget: 4500, spent: flow(4450) },
        { name: "transport", budget: 1200, spent: flow(950) },
        { name: "housing", budget: 1000, spent: flow(980) },
        { name: "lifestyle", budget: 2000, spent: flow(2400) },
        { name: "other", budget: 800, spent: flow(300) },
      ],
    },
  });
}
