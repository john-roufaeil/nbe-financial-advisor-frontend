import { apiClient } from "@/api/client";
import type { BankAccount, CreateBankAccountBody } from "@/types/account";

/**
 * GET /accounts returns a plain array, NOT the {count,next,previous,results}
 * pagination envelope — the backend deliberately leaves this endpoint
 * unpaginated (see BankAccountListCreateView's docstring), since a user's own
 * linked accounts are a small bounded list.
 */
export async function getAccounts(): Promise<BankAccount[]> {
  const res = await apiClient.get<BankAccount[]>("/accounts");
  return res.data;
}

export async function createAccount(body: CreateBankAccountBody): Promise<BankAccount> {
  // The backend's create field is `masked_account_number`, not `account_number`.
  const { account_number, ...rest } = body;
  const res = await apiClient.post<BankAccount>("/accounts", {
    ...rest,
    masked_account_number: account_number,
  });
  return res.data;
}

export async function deleteAccount(id: string): Promise<void> {
  await apiClient.delete(`/accounts/${id}`);
}
