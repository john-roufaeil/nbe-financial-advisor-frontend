import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { CategoryBreakdown, MonthlySummary } from "@/types/analytics";

interface RawTopMerchant {
  merchant: string | null;
  total: string | number;
}

interface RawMonthlySummary {
  month: string;
  total_spend: string | number;
  total_inflow: string | number;
  top_merchants: RawTopMerchant[];
}

function toMonthlySummary(raw: RawMonthlySummary): MonthlySummary {
  return {
    month: raw.month,
    totalSpend: Number(raw.total_spend),
    totalInflow: Number(raw.total_inflow),
    topMerchants: raw.top_merchants.map((m) => ({
      merchant: m.merchant,
      total: Number(m.total),
    })),
  };
}

/** No pagination — bounded by how many distinct months have transactions. `from`/`to` (YYYY-MM) narrow the window. */
export async function getMonthlySummaries(
  from?: string,
  to?: string,
): Promise<MonthlySummary[]> {
  const res = await apiClient.get<RawMonthlySummary[]>(API_ENDPOINTS.monthlySummaries, {
    params: { ...(from ? { from } : {}), ...(to ? { to } : {}) },
  });
  return res.data.map(toMonthlySummary);
}

interface RawCategoryBreakdownEntry {
  category: string;
  amount: string | number;
  percentage_of_total: number;
}

interface RawCategoryBreakdown {
  period: string;
  breakdown: RawCategoryBreakdownEntry[];
}

/** `period` (YYYY-MM) is required — unlike getMonthlySummaries, there's no "all time" mode. */
export async function getCategoryBreakdown(
  period: string,
  accountId?: string,
): Promise<CategoryBreakdown> {
  const res = await apiClient.get<RawCategoryBreakdown>(API_ENDPOINTS.categoryBreakdown, {
    params: { period, ...(accountId ? { account_id: accountId } : {}) },
  });
  return {
    period: res.data.period,
    breakdown: res.data.breakdown.map((b) => ({
      category: b.category,
      amount: Number(b.amount),
      percentageOfTotal: b.percentage_of_total,
    })),
  };
}
