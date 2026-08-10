import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as profileApi from "@/api/profile";
import type { UpdateProfileBody } from "@/types/profile";
import { useCompleteProfileModalStore } from "@/store/use-complete-profile-modal-store";
import { toastApiError } from "@/lib/toast";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";

export const profileKeys = {
  me: [QUERY_ROOTS.profile, "me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => profileApi.getMe(),
    // useUpdateProfile below writes its response straight into this cache
    // entry rather than invalidating, so there's no passive-refetch path
    // that ever needs the default 30s staleTime to expire — same reasoning
    // as useCategories/useAccounts.
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/**
 * Fetches (or reuses the cached) /users/me once and opens CompleteProfileModal
 * if employment_status is still unset — called once right after a fresh
 * sign-in/bank-login, not as a persistent gate, so a user who dismisses it
 * isn't yanked back on every navigation. Errors are swallowed: this is a
 * nice-to-have nudge, not something that should block landing on the dashboard.
 */
export function useCheckProfileCompletion() {
  const queryClient = useQueryClient();
  const openCompleteProfileModal = useCompleteProfileModalStore((s) => s.open);
  return useCallback(async () => {
    try {
      const user = await queryClient.fetchQuery({
        queryKey: profileKeys.me,
        queryFn: () => profileApi.getMe(),
      });
      if (!user.employment_status) openCompleteProfileModal();
    } catch {
      // Profile fetch failing here shouldn't block a successful login.
    }
  }, [queryClient, openCompleteProfileModal]);
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileBody) => profileApi.updateProfile(body),
    // PATCH /users/me already echoes back the full updated user, so write it
    // straight into the cache instead of invalidating and firing a redundant
    // GET /users/me for data we already have.
    onSuccess: (updatedUser) => queryClient.setQueryData(profileKeys.me, updatedUser),
    // Failure surfaces (no fake success); the caller stays on the step.
    onError: (error) => toastApiError(error),
  });
}
