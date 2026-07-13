import { useQuery } from "@tanstack/react-query";
import * as accountsApi from "@/api/accounts";
import * as accountsMock from "@/mocks/accounts";
import type { CreateBankAccountBody } from "@/types/account";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl, useInvalidatingMutation } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, accountsApi, accountsMock);
}

export const accountKeys = {
  all: (source: DataSource) => [QUERY_ROOTS.accounts, source] as const,
};

export function useAccounts() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: accountKeys.all(source),
    queryFn: () => impl(source).getAccounts(),
  });
}

// Mutations also invalidate the dashboard: net worth (its balance stat) is
// the sum of the accounts.

export function useCreateAccount() {
  return useInvalidatingMutation({
    mutationFn: (source, body: CreateBankAccountBody) => impl(source).createAccount(body),
    invalidates: [[QUERY_ROOTS.accounts], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.accountCreated",
  });
}

export function useDeleteAccount() {
  return useInvalidatingMutation({
    mutationFn: (source, id: string) => impl(source).deleteAccount(id),
    invalidates: [[QUERY_ROOTS.accounts], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.accountDeleted",
  });
}
