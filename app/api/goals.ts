import { apiClient } from "@/api/client";
import type { FinancialGoal } from "@/types/goal";

export async function getGoals(): Promise<FinancialGoal[]> {
  const res = await apiClient.get<FinancialGoal[]>("/goals");
  return res.data;
}

export async function createGoal(
  body: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  const res = await apiClient.post<FinancialGoal>("/goals", body);
  return res.data;
}

export async function updateGoal(
  id: string,
  patch: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  const res = await apiClient.patch<FinancialGoal>(`/goals/${id}`, patch);
  return res.data;
}

export async function deleteGoal(id: string): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}
