import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as documentsApi from "@/api/documents";
import * as documentsMock from "@/mocks/documents";
import type { DocumentFilters } from "@/api/documents";
import type { DocumentType, ExtractedTransaction } from "@/types/document";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastSuccess, toastApiError } from "@/lib/toast";

function impl(source: DataSource) {
  return source === "mock" ? documentsMock : documentsApi;
}

export const documentKeys = {
  all: ["documents"] as const,
  list: (filters: DocumentFilters, source: DataSource) =>
    [...documentKeys.all, "list", source, filters] as const,
  detail: (id: string, source: DataSource) =>
    [...documentKeys.all, "detail", source, id] as const,
};

export function useDocuments(filters: DocumentFilters) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: documentKeys.list(filters, source),
    queryFn: () => impl(source).getDocuments(filters),
    refetchInterval: (query) => {
      const hasInFlight = query.state.data?.items?.some(
        (d) => d.status === "uploading" || d.status === "processing",
      );
      return hasInFlight ? 1000 : false;
    },
  });
}

export function useDocument(id: string | null) {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: documentKeys.detail(id ?? "", source),
    queryFn: () => impl(source).getDocument(id as string),
    enabled: id !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "uploading" || status === "processing" ? 1000 : false;
    },
  });
}

export function useUploadDocuments() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (
      files: { name: string; type: DocumentType; sizeKb: number; file: File }[],
    ) =>
      source === "mock"
        ? documentsMock.uploadDocuments(files)
        : documentsApi.uploadDocuments(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toastSuccess("toast.documentUploaded");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useRetryDocument() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).retryDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toastSuccess("toast.documentRetried");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useUpdateExtractedTransaction() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: ({
      documentId,
      transactionId,
      patch,
    }: {
      documentId: string;
      transactionId: string;
      patch: Partial<Omit<ExtractedTransaction, "id">>;
    }) => impl(source).updateExtractedTransaction(documentId, transactionId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
    onError: (error) => toastApiError(error),
  });
}

export function useApproveDocument() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).approveDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toastSuccess("toast.documentApproved");
    },
    onError: (error) => toastApiError(error),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (id: string) => impl(source).deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      toastSuccess("toast.documentDeleted");
    },
    onError: (error) => toastApiError(error),
  });
}
