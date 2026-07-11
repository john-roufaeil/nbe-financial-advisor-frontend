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
        { name: "Groceries", budget: 3000, spent: 2650 },
        { name: "Dining", budget: 1500, spent: 1800 },
        { name: "Transport", budget: 1200, spent: 950 },
        { name: "Utilities", budget: 1000, spent: 980 },
        { name: "Shopping", budget: 2000, spent: 2400 },
        { name: "Health", budget: 800, spent: 300 },
      ],
    },
  });
}
