import { useMutation } from "@tanstack/react-query";
import * as consentApi from "@/api/consent";
import type { ConsentType } from "@/types/consent";
import { toastApiError } from "@/lib/toast";

/** No success toast — fired silently alongside signup, not a user-visible action of its own. */
export function useGrantConsent() {
  return useMutation({
    mutationFn: ({
      consentType,
      policyVersion,
    }: {
      consentType: ConsentType;
      policyVersion: string;
    }) => consentApi.grantConsent(consentType, policyVersion),
    onError: (error) => toastApiError(error),
  });
}
