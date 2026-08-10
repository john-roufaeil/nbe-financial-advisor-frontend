import { delay } from "@/mocks/shared";
import type { BankAccount } from "@/types/account";
import type {
  BankConnection,
  CreateBankConnectionBody,
  CreateBankConnectionResponse,
  BankConnectionCallbackBody,
} from "@/types/bank-connections";

export function listBankConnections(): Promise<BankConnection[]> {
  return delay([
    {
      id: "conn-mock-bank-1",
      provider_slug: "mock_bank",
      status: "linked",
      linked_at: "2026-02-14T09:00:00Z",
      revoked_at: null,
      created_at: "2026-02-14T08:58:00Z",
    },
  ]);
}

export function createBankConnection(
  body: CreateBankConnectionBody,
): Promise<CreateBankConnectionResponse> {
  return delay({
    connection_id: `mock-connection.${body.provider_slug}`,
    authorize_url: `https://mock-bank-oauth.local/authorize?provider=${body.provider_slug}`,
  });
}

export function confirmBankConnection(
  connectionId: string,
  _body: BankConnectionCallbackBody,
): Promise<BankAccount[]> {
  return delay([
    {
      id: crypto.randomUUID(),
      // Matches mock-bank-sync/app/models.py's default bank_name exactly.
      bank_name: "Mock National Bank",
      account_type: "checking",
      // Full number, not a mask: the connector contract hands the real one
      // through (services/bank_connectors/base.py), so synced accounts are
      // indistinguishable in format from manual ones.
      masked_account_number: "1000200030000042",
      currency: "EGP",
      is_active: true,
      link_type: "synced",
      external_account_id: connectionId,
      current_balance: "15430.00",
      created_at: new Date().toISOString(),
    },
  ]);
}
