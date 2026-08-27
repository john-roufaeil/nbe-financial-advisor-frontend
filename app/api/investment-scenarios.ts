import { z } from "zod";
import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import {
  SavedInvestmentScenarioSchema,
  type SavedInvestmentScenario,
  type SavedInvestmentScenarioStatus,
  type PlannedPurchaseInput,
  type PlannedAllocationInput,
} from "@/types/investment-scenario";

const ScenarioListSchema = z.union([
  z.array(SavedInvestmentScenarioSchema),
  z.object({ results: z.array(SavedInvestmentScenarioSchema) }),
]);

export async function getInvestmentScenarios(
  status: SavedInvestmentScenarioStatus = "saved",
  limit?: number,
): Promise<SavedInvestmentScenario[]> {
  const response = await apiClient.get(API_ENDPOINTS.investmentScenarios, {
    params: { status, ...(limit ? { limit } : {}) },
  });
  const parsed = ScenarioListSchema.parse(response.data);
  return Array.isArray(parsed) ? parsed : parsed.results;
}

export async function updateInvestmentScenario(
  id: string,
  changes: Partial<Pick<SavedInvestmentScenario, "title" | "status">>,
): Promise<SavedInvestmentScenario> {
  const response = await apiClient.patch(API_ENDPOINTS.investmentScenario(id), changes);
  return SavedInvestmentScenarioSchema.parse(response.data);
}

export async function deleteInvestmentScenario(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.investmentScenario(id));
}

export async function recordPlannedPurchase({
  scenarioId,
  instrumentId,
  input,
}: {
  scenarioId: string;
  instrumentId: string;
  input: PlannedPurchaseInput;
}): Promise<SavedInvestmentScenario> {
  const response = await apiClient.post(
    API_ENDPOINTS.investmentScenarioPurchase(scenarioId, instrumentId),
    input,
  );
  return SavedInvestmentScenarioSchema.parse(response.data);
}

export async function updatePlannedAllocation({
  scenarioId,
  instrumentId,
  input,
}: {
  scenarioId: string;
  instrumentId: string;
  input: PlannedAllocationInput;
}): Promise<SavedInvestmentScenario> {
  const response = await apiClient.patch(
    API_ENDPOINTS.investmentScenarioAllocation(scenarioId, instrumentId),
    input,
  );
  return SavedInvestmentScenarioSchema.parse(response.data);
}

export async function deletePlannedAllocation({
  scenarioId,
  instrumentId,
}: {
  scenarioId: string;
  instrumentId: string;
}): Promise<void> {
  await apiClient.delete(
    API_ENDPOINTS.investmentScenarioAllocation(scenarioId, instrumentId),
  );
}
