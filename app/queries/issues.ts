import { useQuery } from "@tanstack/react-query";
import * as issuesApi from "@/api/issues";
import type { IssueFilters } from "@/api/issues";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";

export const issueKeys = {
  list: (filters: IssueFilters) => [QUERY_ROOTS.issues, filters] as const,
};

export function useIssues(filters: IssueFilters = {}) {
  return useQuery({
    queryKey: issueKeys.list(filters),
    queryFn: () => issuesApi.getIssues(filters),
  });
}

export function useCreateIssue() {
  return useInvalidatingMutation({
    mutationFn: (description: string) => issuesApi.createIssue(description),
    invalidates: [[QUERY_ROOTS.issues]],
    successToastKey: "toast.issueReported",
  });
}
