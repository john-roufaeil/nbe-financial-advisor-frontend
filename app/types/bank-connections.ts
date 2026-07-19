export const BANK_CONNECTION_STATUSES = [
  "pending_otp",
  "linked",
  "revoked",
  "failed",
] as const;
export type BankConnectionStatus = (typeof BANK_CONNECTION_STATUSES)[number];

export interface BankConnection {
  id: string;
  provider_slug: string;
  status: BankConnectionStatus;
  linked_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface CreateBankConnectionBody {
  provider_slug: string;
}

export interface CreateBankConnectionResponse {
  connection_id: string;
  authorize_url: string;
}

export interface BankConnectionCallbackBody {
  code: string;
  state: string;
}
