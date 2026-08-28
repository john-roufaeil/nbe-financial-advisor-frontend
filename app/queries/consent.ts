import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as consentApi from "@/api/consent";
import type { ConsentType } from "@/types/consent";
import { toastApiError } from "@/lib/toast";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";

export const consentKeys = {
  history: [QUERY_ROOTS.consent, "history"] as const,
};

/** No success toast either at signup (fired silently alongside it) or from
 * the profile page's on/off consent toggle (PrivacyConsentToggles) — the
 * toggle's own visual state is feedback enough, same convention as
 * HighContrastToggle/ThemeSwitch. Does invalidate the history cache so a
 * toggle flips back to reflect the real state on success. */
export function useGrantConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      consentType,
      policyVersion,
    }: {
      consentType: ConsentType;
      policyVersion: string;
    }) => consentApi.grantConsent(consentType, policyVersion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consentKeys.history }),
    onError: (error) => toastApiError(error),
  });
}

/** Profile page's "Privacy & consent" toggles (Account Management) —
 * PrivacyConsentToggles derives each toggle's on/off state from this
 * full history rather than a dedicated "current state" endpoint. */
export function useConsentHistory(enabled = true) {
  return useQuery({
    queryKey: consentKeys.history,
    queryFn: () => consentApi.getConsentHistory(),
    enabled,
  });
}

/**
 * Current on/off state for a single consent type — same derivation as
 * PrivacyConsentToggles (newest record for the type wins), for callers that
 * only care about one type (e.g. gating a feature on `data_processing`
 * rather than rendering the full toggle list). History is newest-first, so
 * the first matching record already is the latest one.
 */
export function useConsentStatus(consentType: ConsentType, enabled = true) {
  const { data, isPending } = useConsentHistory(enabled);
  const latest = data?.find((record) => record.consentType === consentType);
  return { isActive: !!latest?.grantedAt && !latest?.revokedAt, isPending };
}

/** No success toast — see useGrantConsent's docstring. */
export function useRevokeConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consentApi.revokeConsent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consentKeys.history }),
    onError: (error) => toastApiError(error),
  });
}
