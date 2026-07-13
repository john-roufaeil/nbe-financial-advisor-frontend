import { useMutation } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import * as authMock from "@/mocks/auth";
import type { SignupBody, LoginBody } from "@/types/auth";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { useAuthStore } from "@/store/use-auth-store";
import { toastApiError } from "@/lib/toast";

function impl(source: DataSource) {
  return source === "mock" ? authMock : authApi;
}

export function useSignup() {
  const source = useDataSourceStore((s) => s.source);
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (body: SignupBody) => impl(source).signup(body),
    // Store tokens but do NOT flip isAuthenticated — the user isn't "logged in"
    // until the flow completes (so route guards don't bounce a half-onboarded user).
    onSuccess: (tokens) => setTokens({ accessToken: tokens.access_token }),
    // Failure surfaces (no fake success); the caller stays on the step.
    onError: (error) => toastApiError(error),
  });
}

export function useLogin() {
  const source = useDataSourceStore((s) => s.source);
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (body: LoginBody) => impl(source).login(body),
    onSuccess: (tokens) => setTokens({ accessToken: tokens.access_token }),
    onError: (error) => toastApiError(error),
  });
}
