import { apiClient } from "@/api/client";
import type {
  DocumentRecord,
  DocumentType,
  ExtractedTransaction,
} from "@/types/document";

export interface DocumentFilters {
  type?: DocumentType;
  q?: string;
  from?: string;
  to?: string;
  offset?: number;
  limit?: number;
}

export interface DocumentListResponse {
  items: DocumentRecord[];
  total: number;
}

export async function getDocuments(
  filters: DocumentFilters,
): Promise<DocumentListResponse> {
  const res = await apiClient.get<
    DocumentListResponse | { results: DocumentRecord[]; count: number }
  >("/statements", {
    params: filters,
  });
  // Map DRF LimitOffsetPagination response to the frontend's expected shape
  if ("results" in res.data) {
    return { items: res.data.results, total: res.data.count };
  }
  return res.data;
}

export async function getDocument(id: string): Promise<DocumentRecord> {
  const res = await apiClient.get<DocumentRecord>(`/statements/${id}`);
  return res.data;
}

export async function uploadDocuments(
  files: { name: string; type: DocumentType; sizeKb: number; file: File }[],
): Promise<DocumentRecord[]> {
  const formData = new FormData();
  for (const f of files) formData.append("files", f.file, f.name);
  const res = await apiClient.post<DocumentRecord[]>("/statements", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function retryDocument(id: string): Promise<DocumentRecord> {
  const res = await apiClient.post<DocumentRecord>(`/statements/${id}/retry`);
  return res.data;
}

export async function updateExtractedTransaction(
  documentId: string,
  transactionId: string,
  patch: Partial<Omit<ExtractedTransaction, "id">>,
): Promise<ExtractedTransaction> {
  const res = await apiClient.patch<ExtractedTransaction>(
    `/statements/${documentId}/normalized/${transactionId}`,
    patch,
  );
  return res.data;
}

export async function approveDocument(
  id: string,
): Promise<{ approvedAt: string; createdTransactionIds: string[] }> {
  const res = await apiClient.post(`/statements/${id}/approve`);
  return res.data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/statements/${id}`);
}
