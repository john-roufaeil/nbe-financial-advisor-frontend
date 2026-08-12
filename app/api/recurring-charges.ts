import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { RecurringCharge, RecurringChargeFilters } from "@/types/recurring-charge";

interface RawRecurringCharge {
  id: string;
  merchant_normalized: string;
  frequency: string;
  avg_amount: string | number;
  last_occurrence_date: string;
  next_expected_date: string | null;
}

function toRecurringCharge(raw: RawRecurringCharge): RecurringCharge {
  return {
    id: raw.id,
    merchantNormalized: raw.merchant_normalized,
    frequency: raw.frequency,
    avgAmount: Number(raw.avg_amount),
    lastOccurrenceDate: raw.last_occurrence_date,
    nextExpectedDate: raw.next_expected_date,
  };
}

/** Unpaginated — small, bounded per-user collection (same reasoning as GET /accounts). */
export async function getRecurringCharges(
  filters?: RecurringChargeFilters,
): Promise<RecurringCharge[]> {
  const res = await apiClient.get<RawRecurringCharge[]>(API_ENDPOINTS.recurringCharges, {
    params: filters?.accountId ? { account_id: filters.accountId } : undefined,
  });
  return res.data.map(toRecurringCharge);
}
