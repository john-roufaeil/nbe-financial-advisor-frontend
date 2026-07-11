import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as profileApi from "@/api/profile";
import * as profileMock from "@/mocks/profile";
import type { UpdateProfileBody } from "@/types/profile";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { toastApiError } from "@/lib/toast";

function impl(source: DataSource) {
  return source === "mock" ? profileMock : profileApi;
}

export const profileKeys = {
  me: (source: DataSource) => ["profile", "me", source] as const,
};

export function useMe() {
  const source = useDataSourceStore((s) => s.source);
  return useQuery({
    queryKey: profileKeys.me(source),
    queryFn: () => impl(source).getMe(),
  });
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
