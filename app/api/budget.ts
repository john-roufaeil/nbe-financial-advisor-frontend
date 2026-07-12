import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  StarterTemplate,
  CreateBudgetBody,
  UpdateBudgetBody,
  Budget,
} from "@/types/budget";

export async function getStarterTemplates(): Promise<StarterTemplate[]> {
  const res = await apiClient.get<StarterTemplate[]>(
    API_ENDPOINTS.budgetStarterTemplates,
  );
  return res.data;
}

export async function createBudget(body: CreateBudgetBody): Promise<Budget> {
  const res = await apiClient.post<Budget>(API_ENDPOINTS.budget, body);
  return res.data;
}

export async function getBudget(): Promise<Budget> {
  const res = await apiClient.get<Budget>(API_ENDPOINTS.budget);
  return res.data;
}

export async function updateBudget(body: UpdateBudgetBody): Promise<Budget> {
  const res = await apiClient.patch<Budget>(API_ENDPOINTS.budget, body);
  return res.data;
}
