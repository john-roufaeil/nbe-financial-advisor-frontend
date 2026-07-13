import { delay } from "@/mocks/shared";
import type { DashboardSummary } from "@/types/dashboard";

export function getDashboardSummary(): Promise<DashboardSummary> {
  return delay({
    currency: "EGP",
    hasPlan: true,
    stats: [
      { key: "balance", value: 128450, deltaPct: 4.2, goodDirection: "up" },
      { key: "income", value: 42000, deltaPct: 1.5, goodDirection: "up" },
      { key: "spending", value: 27860, deltaPct: -6.3, goodDirection: "down" },
      { key: "savingsRate", value: 34, deltaPct: 2, goodDirection: "up" },
    ],
    budget: {
      categories: [
        { name: "food", budget: 3000, spent: 2650 },
        { name: "food", budget: 1500, spent: 1800 },
        { name: "transport", budget: 1200, spent: 950 },
        { name: "housing", budget: 1000, spent: 980 },
        { name: "lifestyle", budget: 2000, spent: 2400 },
        { name: "other", budget: 800, spent: 300 },
      ],
    },
  });
}
