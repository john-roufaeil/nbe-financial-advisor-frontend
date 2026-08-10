import { useQuery } from "@tanstack/react-query";
import * as accountsApi from "@/api/accounts";
import type { CreateBankAccountBody } from "@/types/account";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { useInvalidatingMutation } from "@/queries/shared";

export const accountKeys = {
  all: [QUERY_ROOTS.accounts] as const,
};

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.all,
    queryFn: () => accountsApi.getAccounts(),
    // Accounts only change via the mutations below, which already
    // invalidate this key (that refetches regardless of staleTime) — so
    // there's nothing to gain from the default 30s staleTime expiring and
    // silently refetching on every remount as the user browses between
    // pages, same reasoning as useCategories.
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

// Mutations also invalidate the dashboard: net worth (its balance stat) is
// the sum of the accounts.

export function useCreateAccount() {
  return useInvalidatingMutation({
    mutationFn: (body: CreateBankAccountBody) => accountsApi.createAccount(body),
    invalidates: [[QUERY_ROOTS.accounts], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.accountCreated",
  });
}

export function useDeleteAccount() {
  return useInvalidatingMutation({
    mutationFn: (id: string) => accountsApi.deleteAccount(id),
    invalidates: [[QUERY_ROOTS.accounts], [QUERY_ROOTS.dashboard]],
    successToastKey: "toast.accountDeleted",
  });
}
