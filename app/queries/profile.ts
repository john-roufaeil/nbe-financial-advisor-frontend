import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as profileApi from "@/api/profile";
import * as profileMock from "@/mocks/profile";
import type { UpdateProfileBody } from "@/types/profile";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { useCompleteProfileModalStore } from "@/store/use-complete-profile-modal-store";
import { toastApiError } from "@/lib/toast";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { pickImpl } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, profileApi, profileMock);
}

export const profileKeys = {
  me: (source: DataSource) => [QUERY_ROOTS.profile, "me", source] as const,
};

export function useMe() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: profileKeys.me(source),
    queryFn: () => impl(source).getMe(),
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
  const source = useDataSourceStore((s) => s.source);
  const openCompleteProfileModal = useCompleteProfileModalStore((s) => s.open);
  return useCallback(async () => {
    try {
      const user = await queryClient.fetchQuery({
        queryKey: profileKeys.me(source),
        queryFn: () => impl(source).getMe(),
      });
      if (!user.employment_status) openCompleteProfileModal();
    } catch {
      // Profile fetch failing here shouldn't block a successful login.
    }
  }, [queryClient, source, openCompleteProfileModal]);
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: UpdateProfileBody) => impl(source).updateProfile(body),
    // PATCH /users/me already echoes back the full updated user, so write it
    // straight into the cache instead of invalidating and firing a redundant
    // GET /users/me for data we already have.
    onSuccess: (updatedUser) =>
      queryClient.setQueryData(profileKeys.me(source), updatedUser),
    // Failure surfaces (no fake success); the caller stays on the step.
    onError: (error) => toastApiError(error),
  });
}
