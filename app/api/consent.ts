import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { ConsentRecord, ConsentType } from "@/types/consent";

interface RawConsentRecord {
  id: string;
  consent_type: string;
  policy_version: string;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

function toConsentRecord(raw: RawConsentRecord): ConsentRecord {
  return {
    id: raw.id,
    consentType: raw.consent_type as ConsentType,
    policyVersion: raw.policy_version,
    grantedAt: raw.granted_at,
    revokedAt: raw.revoked_at,
    createdAt: raw.created_at,
  };
}

/** Always appends a new grant row — see ConsentRecord's docstring. */
export async function grantConsent(
  consentType: ConsentType,
  policyVersion: string,
): Promise<ConsentRecord> {
  const res = await apiClient.post<RawConsentRecord>(API_ENDPOINTS.usersMeConsent, {
    consent_type: consentType,
    policy_version: policyVersion,
  });
  return toConsentRecord(res.data);
}

/** Full grant/revoke history, newest first — the profile page's
 * "Privacy & consent" section in Account Management. */
export async function getConsentHistory(): Promise<ConsentRecord[]> {
  const res = await apiClient.get<RawConsentRecord[]>(API_ENDPOINTS.usersMeConsent);
  return res.data.map(toConsentRecord);
}

/** Appends a revoke event for the given grant — never deletes/mutates it,
 * same append-only convention as grantConsent. */
export async function revokeConsent(id: string): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.usersMeConsentRevoke(id));
}
