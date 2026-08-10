import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { BankAccount, CreateBankAccountBody } from "@/types/account";

/** Wire shape from BankAccountSerializer — the DB column (and JSON field) is
 * `masked_account_number`, not `account_number`; everything else matches. */
type BankAccountWire = Omit<BankAccount, "account_number"> & {
  masked_account_number: string;
};

function fromWire(wire: BankAccountWire): BankAccount {
  const { masked_account_number, ...rest } = wire;
  return { ...rest, account_number: masked_account_number };
}

/**
 * GET /accounts returns a plain array, NOT the {count,next,previous,results}
 * pagination envelope — the backend deliberately leaves this endpoint
 * unpaginated (see BankAccountListCreateView's docstring), since a user's own
 * linked accounts are a small bounded list.
 */
export async function getAccounts(): Promise<BankAccount[]> {
  const res = await apiClient.get<BankAccountWire[]>(API_ENDPOINTS.accounts);
  return res.data.map(fromWire);
}

export async function createAccount(body: CreateBankAccountBody): Promise<BankAccount> {
  const { account_number, ...rest } = body;
  const res = await apiClient.post<BankAccountWire>(API_ENDPOINTS.accounts, {
    ...rest,
    masked_account_number: account_number,
  });
  return fromWire(res.data);
}

export async function deleteAccount(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.account(id));
}
