export const CONSENT_TYPES = ["terms_of_service", "data_processing"] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

/** Bump this whenever the terms/privacy content in PrivacyPolicyModal changes. */
export const CURRENT_POLICY_VERSION = "v2.0";

/**
 * POST /users/me/consent response (ConsentRecordSerializer) — one grant or
 * revoke event, not the user's current consent state. History is append-only:
 * revoking creates a new row rather than mutating the granted one.
 */
export interface ConsentRecord {
  id: string;
  consentType: ConsentType;
  policyVersion: string;
  grantedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}
