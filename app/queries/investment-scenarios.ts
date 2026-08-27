import { useQuery } from "@tanstack/react-query";
import * as investmentScenariosApi from "@/api/investment-scenarios";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";
import { investmentHoldingKeys } from "@/queries/investment-holdings";
import type {
  PlannedPurchaseInput,
  PlannedAllocationInput,
  SavedInvestmentScenario,
  SavedInvestmentScenarioStatus,
} from "@/types/investment-scenario";

export const investmentScenarioKeys = {
  all: [QUERY_ROOTS.investmentScenarios] as const,
  list: (status: SavedInvestmentScenarioStatus, limit?: number) =>
    [QUERY_ROOTS.investmentScenarios, status, limit] as const,
};

export function useInvestmentScenarios(
  status: SavedInvestmentScenarioStatus = "saved",
  limit?: number,
) {
  return useQuery({
    queryKey: investmentScenarioKeys.list(status, limit),
    queryFn: () => investmentScenariosApi.getInvestmentScenarios(status, limit),
  });
}

export function useUpdateInvestmentScenario() {
  return useInvalidatingMutation({
    mutationFn: ({
      id,
      changes,
    }: {
      id: string;
      changes: Partial<Pick<SavedInvestmentScenario, "title" | "status">>;
    }) => investmentScenariosApi.updateInvestmentScenario(id, changes),
    invalidates: [investmentScenarioKeys.all],
    successToastKey: "toast.investmentScenarioUpdated",
  });
}

export function useDeleteInvestmentScenario() {
  return useInvalidatingMutation({
    mutationFn: investmentScenariosApi.deleteInvestmentScenario,
    invalidates: [investmentScenarioKeys.all],
    successToastKey: "toast.investmentScenarioDeleted",
  });
}

export function useRecordPlannedPurchase() {
  return useInvalidatingMutation({
    mutationFn: ({
      scenarioId,
      instrumentId,
      input,
    }: {
      scenarioId: string;
      instrumentId: string;
      input: PlannedPurchaseInput;
    }) =>
      investmentScenariosApi.recordPlannedPurchase({
        scenarioId,
        instrumentId,
        input,
      }),
    invalidates: [investmentScenarioKeys.all, investmentHoldingKeys.all],
    successToastKey: "toast.plannedPurchaseRecorded",
  });
}

export function useUpdatePlannedAllocation() {
  return useInvalidatingMutation({
    mutationFn: ({
      scenarioId,
      instrumentId,
      input,
    }: {
      scenarioId: string;
      instrumentId: string;
      input: PlannedAllocationInput;
    }) =>
      investmentScenariosApi.updatePlannedAllocation({
        scenarioId,
        instrumentId,
        input,
      }),
    invalidates: [investmentScenarioKeys.all],
    successToastKey: "toast.plannedInvestmentUpdated",
  });
}

export function useDeletePlannedAllocation() {
  return useInvalidatingMutation({
    mutationFn: investmentScenariosApi.deletePlannedAllocation,
    invalidates: [investmentScenarioKeys.all],
    successToastKey: "toast.plannedInvestmentRemoved",
  });
}
