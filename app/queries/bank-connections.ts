import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as bankConnectionsApi from "@/api/bank-connections";
import type {
  CreateBankConnectionBody,
  BankConnectionCallbackBody,
} from "@/types/bank-connections";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastApiError, toastSuccess } from "@/lib/toast";

export function useBankConnections() {
  return useQuery({
    queryKey: ["bank-connections"],
    queryFn: () => bankConnectionsApi.listBankConnections(),
  });
}

export function useCreateBankConnection() {
  return useMutation({
    mutationFn: (body: CreateBankConnectionBody) =>
      bankConnectionsApi.createBankConnection(body),
    onError: (error) => toastApiError(error),
  });
}

export function useConfirmBankConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      body,
    }: {
      connectionId: string;
      body: BankConnectionCallbackBody;
    }) => bankConnectionsApi.confirmBankConnection(connectionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.accounts] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
      toastSuccess("toast.bankConnected");
    },
    onError: (error) => toastApiError(error),
  });
}
