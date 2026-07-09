import { apiClient } from "@/api/client";
import type { BankAccount } from "@/types/account";

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
