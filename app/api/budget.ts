import { apiClient } from "@/api/client";
import type { StarterTemplate, CreateBudgetBody, Budget } from "@/types/budget";

export async function getStarterTemplates(): Promise<StarterTemplate[]> {
  const res = await apiClient.get<StarterTemplate[]>("/budget/starter-templates");
  return res.data;
}

export async function createBudget(body: CreateBudgetBody): Promise<Budget> {
  const res = await apiClient.post<Budget>("/budget", body);
  return res.data;
}
