import { delay } from "@/mocks/shared";
import type { BankAccount } from "@/types/account";

const accounts: BankAccount[] = [
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
