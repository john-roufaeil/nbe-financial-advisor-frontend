import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { Issue, IssueStatus } from "@/types/issue";

interface RawIssue {
  id: string;
  description: string;
  status: IssueStatus;
  created_at: string;
  resolved_at: string | null;
}

interface PaginatedIssues {
  count: number;
  results: RawIssue[];
}

function toIssue(raw: RawIssue): Issue {
  return {
    id: raw.id,
    description: raw.description,
    status: raw.status,
    createdAt: raw.created_at,
    resolvedAt: raw.resolved_at,
  };
}

export interface IssueFilters {
  limit?: number;
  offset?: number;
}

export async function getIssues(
  filters: IssueFilters = {},
): Promise<{ items: Issue[]; total: number }> {
  const params: Record<string, number> = {};
  if (filters.limit !== undefined) params.limit = filters.limit;
  if (filters.offset !== undefined) params.offset = filters.offset;

  const res = await apiClient.get<PaginatedIssues>(API_ENDPOINTS.issues, { params });
  return { items: res.data.results.map(toIssue), total: res.data.count };
}

/** Backend enforces a 10-character minimum on `description`. */
export async function createIssue(description: string): Promise<Issue> {
  const res = await apiClient.post<RawIssue>(API_ENDPOINTS.issues, { description });
  return toIssue(res.data);
}
