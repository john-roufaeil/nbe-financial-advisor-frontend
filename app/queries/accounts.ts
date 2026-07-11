import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as accountsApi from "@/api/accounts";
import * as accountsMock from "@/mocks/accounts";
import type { CreateBankAccountBody, UpdateBankAccountBody } from "@/types/account";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastSuccess, toastApiError } from "@/lib/toast";

function impl(source: DataSource) {
  return source === "mock" ? accountsMock : accountsApi;
}

export const accountKeys = {
  all: (source: DataSource) => ["accounts", source] as const,
};

export function useAccounts() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: accountKeys.all(source),
    queryFn: () => impl(source).getAccounts(),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: CreateBankAccountBody) => impl(source).createAccount(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toastSuccess("toast.accountCreated");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBankAccountBody }) =>
      impl(source).updateAccount(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toastSuccess("toast.accountUpdated");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toastSuccess("toast.accountDeleted");
    },
    onError: (error) => toastApiError(error),
  });
}
