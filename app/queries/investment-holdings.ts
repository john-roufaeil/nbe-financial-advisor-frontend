import { useQuery } from "@tanstack/react-query";
import * as api from "@/api/investment-holdings";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";
import type { InvestmentHoldingInput } from "@/types/investment-holding";

export const investmentHoldingKeys = {
  all: [QUERY_ROOTS.investmentHoldings] as const,
  list: () => [QUERY_ROOTS.investmentHoldings, "list"] as const,
  valuation: () => [QUERY_ROOTS.investmentHoldings, "valuation"] as const,
  instruments: () => [QUERY_ROOTS.investmentHoldings, "instruments"] as const,
};

export function useInvestmentInstruments() {
  return useQuery({
    queryKey: investmentHoldingKeys.instruments(),
    queryFn: api.getInvestmentInstruments,
    staleTime: 5 * 60_000,
  });
}

export function useInvestmentHoldings() {
  return useQuery({
    queryKey: investmentHoldingKeys.list(),
    queryFn: api.getInvestmentHoldings,
  });
}

export function useHoldingValuation() {
  return useQuery({
    queryKey: investmentHoldingKeys.valuation(),
    queryFn: api.getHoldingValuation,
    refetchInterval: (query) =>
      query.state.data?.feature_status === "enabled" ? 60_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function useCreateInvestmentHolding() {
  return useInvalidatingMutation({
    mutationFn: api.createInvestmentHolding,
    invalidates: [investmentHoldingKeys.all],
    successToastKey: "toast.investmentHoldingSaved",
  });
}

export function useUpdateInvestmentHolding() {
  return useInvalidatingMutation({
    mutationFn: ({ id, input }: { id: string; input: InvestmentHoldingInput }) =>
      api.updateInvestmentHolding(id, input),
    invalidates: [investmentHoldingKeys.all],
    successToastKey: "toast.investmentHoldingUpdated",
  });
}

export function useDeleteInvestmentHolding() {
  return useInvalidatingMutation({
    mutationFn: api.deleteInvestmentHolding,
    invalidates: [investmentHoldingKeys.all],
    successToastKey: "toast.investmentHoldingDeleted",
  });
}
