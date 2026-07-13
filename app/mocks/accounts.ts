import { delay } from "@/mocks/shared";
import type { BankAccount, CreateBankAccountBody } from "@/types/account";

let accounts: BankAccount[] = [
  {
    id: "acc-nbe-1",
    bank_name: "National Bank of Egypt",
    account_type: "checking",
    masked_account_number: "****4821",
    currency: "EGP",
    is_active: true,
    current_balance: "86200.00",
    created_at: "2025-11-02T10:00:00Z",
  },
  {
    id: "acc-cib-1",
    bank_name: "Commercial International Bank",
    account_type: "savings",
    masked_account_number: "****9137",
    currency: "EGP",
    is_active: true,
    current_balance: "42250.00",
    created_at: "2026-01-19T10:00:00Z",
  },
];

export function getAccounts(): Promise<BankAccount[]> {
  return delay(accounts);
}

export function createAccount(body: CreateBankAccountBody): Promise<BankAccount> {
  const created: BankAccount = {
    id: crypto.randomUUID(),
    bank_name: body.bank_name,
    account_type: body.account_type,
    masked_account_number: `****${body.account_number.slice(-4)}`,
    currency: body.currency,
    is_active: true,
    // Derived server-side from the latest transaction; a new account has none.
    current_balance: "0.00",
    created_at: new Date().toISOString(),
  };
  accounts = [...accounts, created];
  return delay(created);
}

export function deleteAccount(id: string): Promise<void> {
  accounts = accounts.filter((a) => a.id !== id);
  return delay(undefined);
}
