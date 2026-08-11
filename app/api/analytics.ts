import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { MonthlySummary } from "@/types/analytics";

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
