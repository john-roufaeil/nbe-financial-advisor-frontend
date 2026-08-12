import { useQuery, useMutation } from "@tanstack/react-query";
import * as preferencesApi from "@/api/preferences";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastApiError } from "@/lib/toast";

export const preferencesKeys = {
  all: [QUERY_ROOTS.profile, "preferences"] as const,
};

export function usePreferences() {
  return useQuery({
    queryKey: preferencesKeys.all,
    queryFn: () => preferencesApi.getPreferences(),
  });
}

/** No success toast — callers already confirm the change via their own local UI (e.g. PreferenceFormatSwitch's toast); this just persists it server-side too. */
export function useUpdatePreferences() {
  return useMutation({
    mutationFn: preferencesApi.updatePreferences,
    onError: (error) => toastApiError(error),
  });
}
