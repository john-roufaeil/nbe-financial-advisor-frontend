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
