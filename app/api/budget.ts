import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  StarterTemplate,
  CreateBudgetBody,
  UpdateBudgetBody,
  Budget,
  BudgetHistoryEntry,
  BudgetProgress,
  BudgetProgressStatus,
} from "@/types/budget";

interface RawBudgetHistoryAllocation {
  category: string;
  allocated_percentage: number;
  allocated_amount: number;
}

interface RawBudgetHistoryEntry {
  id: string;
  previous_values: { allocations: RawBudgetHistoryAllocation[] };
  changed_via: string;
  changed_at: string;
}

interface PaginatedBudgetHistory {
  count: number;
  results: RawBudgetHistoryEntry[];
}

function toBudgetHistoryEntry(raw: RawBudgetHistoryEntry): BudgetHistoryEntry {
  return {
    id: raw.id,
    previousAllocations: raw.previous_values.allocations.map((a) => ({
      category: a.category,
      allocatedPercentage: a.allocated_percentage,
      allocatedAmount: a.allocated_amount,
    })),
    changedVia: raw.changed_via as BudgetHistoryEntry["changedVia"],
    changedAt: raw.changed_at,
  };
}

interface RawBudgetProgress {
  period: string;
  categories: {
    category: string;
    allocated_amount: string | number;
    actual_amount: string | number;
    percentage_used: number;
    status: string;
  }[];
}

function toBudgetProgress(raw: RawBudgetProgress): BudgetProgress {
  return {
    period: raw.period,
    categories: raw.categories.map((c) => ({
      category: c.category,
      allocatedAmount: Number(c.allocated_amount),
      actualAmount: Number(c.actual_amount),
      percentageUsed: c.percentage_used,
      status: c.status as BudgetProgressStatus,
    })),
  };
}

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

export async function getBudgetProgress(period?: string): Promise<BudgetProgress> {
  const res = await apiClient.get<RawBudgetProgress>(API_ENDPOINTS.budgetProgress, {
    params: period ? { period } : undefined,
  });
  return toBudgetProgress(res.data);
}

export async function getBudgetHistory(filters: {
  limit?: number;
  offset?: number;
}): Promise<{ items: BudgetHistoryEntry[]; total: number }> {
  const params: Record<string, number> = {};
  if (filters.offset !== undefined) params.offset = filters.offset;
  if (filters.limit !== undefined) params.limit = filters.limit;

  const res = await apiClient.get<PaginatedBudgetHistory>(API_ENDPOINTS.budgetHistory, {
    params,
  });
  return {
    items: res.data.results.map(toBudgetHistoryEntry),
    total: res.data.count,
  };
}
