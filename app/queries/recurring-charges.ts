import { useQuery } from "@tanstack/react-query";
import * as recurringChargesApi from "@/api/recurring-charges";
import type { RecurringChargeFilters } from "@/types/recurring-charge";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";

export function useRecurringCharges(filters?: RecurringChargeFilters) {
  return useQuery({
    queryKey: [QUERY_ROOTS.recurringCharges, filters],
    queryFn: () => recurringChargesApi.getRecurringCharges(filters),
  });
}
