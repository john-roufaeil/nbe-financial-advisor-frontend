import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { BankAccount, CreateBankAccountBody } from "@/types/account";

/**
 * GET /accounts returns a plain array, NOT the {count,next,previous,results}
 * pagination envelope — the backend deliberately leaves this endpoint
 * unpaginated (see BankAccountListCreateView's docstring), since a user's own
 * linked accounts are a small bounded list.
 */
export async function getAccounts(): Promise<BankAccount[]> {
  const res = await apiClient.get<BankAccount[]>(API_ENDPOINTS.accounts);
  return res.data;
}

export async function createAccount(body: CreateBankAccountBody): Promise<BankAccount> {
  const res = await apiClient.post<BankAccount>(API_ENDPOINTS.accounts, body);
  return res.data;
}

export async function deleteAccount(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.account(id));
}
