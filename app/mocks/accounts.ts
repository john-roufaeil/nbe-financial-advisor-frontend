import { delay } from "@/mocks/shared";
import type { BankAccount, CreateBankAccountBody } from "@/types/account";

let accounts: BankAccount[] = [
  {
    id: "acc-nbe-1",
    bank_name: "National Bank of Egypt",
    account_type: "checking",
    // Manually-added and statement-derived accounts carry the full number;
    // only bank-synced ones stay masked (see mocks/bank-connections.ts).
    account_number: "1000200030004821",
    currency: "EGP",
    is_active: true,
    link_type: "manual",
    external_account_id: null,
    current_balance: "86200.00",
    created_at: "2025-11-02T10:00:00Z",
  },
  {
    id: "acc-cib-1",
    bank_name: "Commercial International Bank",
    account_type: "savings",
    account_number: "5500660077009137",
    currency: "EGP",
    is_active: true,
    link_type: "manual",
    external_account_id: null,
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
    // Stored and echoed verbatim, mirroring BankAccountSerializer.
    account_number: body.account_number,
    currency: body.currency,
    is_active: true,
    link_type: "manual",
    external_account_id: null,
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
