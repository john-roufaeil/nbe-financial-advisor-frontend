import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as bankConnectionsApi from "@/api/bank-connections";
import * as bankConnectionsMock from "@/mocks/bank-connections";
import type {
  CreateBankConnectionBody,
  BankConnectionCallbackBody,
} from "@/types/bank-connections";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { pickImpl } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, bankConnectionsApi, bankConnectionsMock);
}

export function useBankConnections() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: ["bank-connections", source],
    queryFn: () => impl(source).listBankConnections(),
  });
}

export function useCreateBankConnection() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: CreateBankConnectionBody) =>
      impl(source).createBankConnection(body),
    onError: (error) => toastApiError(error),
  });
}

export function useConfirmBankConnection() {
  const source = useDataSourceStore((s) => s.source);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      body,
    }: {
      connectionId: string;
      body: BankConnectionCallbackBody;
    }) => impl(source).confirmBankConnection(connectionId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.accounts] });
      queryClient.invalidateQueries({ queryKey: [QUERY_ROOTS.dashboard] });
      queryClient.invalidateQueries({ queryKey: ["bank-connections"] });
      toastSuccess("toast.bankConnected");
    },
    onError: (error) => toastApiError(error),
  });
}
