import { apiClient } from "@/api/client";
import type { DashboardSummary } from "@/types/dashboard";

interface RawAllocation {
  category: string;
  allocated_percentage: number;
  percentage_used: number;
}

interface RawDashboard {
  net_worth?: { total_across_accounts?: number };
  metrics?: {
    current_month_inflow?: number;
    current_month_spend?: number;
    income_stability_score?: number;
  };
  allocations_summary?: RawAllocation[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get<RawDashboard>("/dashboard");
  const data = res.data;

  const stats = [
    {
      key: "balance" as const,
      value: data.net_worth?.total_across_accounts || 0,
      deltaPct: 0,
      goodDirection: "up" as const,
    },
    {
      key: "income" as const,
      value: data.metrics?.current_month_inflow || 0,
      deltaPct: 0,
      goodDirection: "up" as const,
    },
    {
      key: "spending" as const,
      value: data.metrics?.current_month_spend || 0,
      deltaPct: 0,
      goodDirection: "down" as const,
    },
    {
      key: "savingsRate" as const,
      value: data.metrics?.income_stability_score || 0,
      deltaPct: 0,
      goodDirection: "up" as const,
    },
  ];

  const totalBudget = data.metrics?.current_month_inflow || 0;
  const categories = (data.allocations_summary || []).map((alloc) => {
    const budgetAmount = (alloc.allocated_percentage / 100) * totalBudget;
    const spentAmount = (alloc.percentage_used / 100) * budgetAmount;
    return {
      name: alloc.category,
      budget: budgetAmount,
      spent: spentAmount,
    };
  });

  return {
    currency: "EGP",
    stats,
    budget: { categories },
  };
}
