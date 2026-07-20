import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { BankAccount } from "@/types/account";
import type {
  BankConnection,
  CreateBankConnectionBody,
  CreateBankConnectionResponse,
  BankConnectionCallbackBody,
} from "@/types/bank-connections";

export async function listBankConnections(): Promise<BankConnection[]> {
  const res = await apiClient.get<BankConnection[]>(API_ENDPOINTS.bankConnections);
  return res.data;
}

export async function createBankConnection(
  body: CreateBankConnectionBody,
): Promise<CreateBankConnectionResponse> {
  const res = await apiClient.post<CreateBankConnectionResponse>(
    API_ENDPOINTS.bankConnections,
    body,
  );
  return res.data;
}

export async function confirmBankConnection(
  connectionId: string,
  body: BankConnectionCallbackBody,
): Promise<BankAccount[]> {
  const res = await apiClient.post<BankAccount[]>(
    API_ENDPOINTS.bankConnectionCallback(connectionId),
    body,
  );
  return res.data;
}
