import { useMutation } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import * as authMock from "@/mocks/auth";
import type {
  SignupBody,
  LoginBody,
  VerifyEmailConfirmBody,
  PasswordResetRequestBody,
  PasswordResetConfirmBody,
  BankLoginInitiateBody,
  BankLoginCallbackBody,
} from "@/types/auth";
import { useDataSourceStore, type DataSource } from "@/store/use-data-source-store";
import { useAuthStore } from "@/store/use-auth-store";
import { toastApiError, toastSuccess } from "@/lib/toast";
import { pickImpl } from "@/queries/shared";

function impl(source: DataSource) {
  return pickImpl(source, authApi, authMock);
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

export function useLogout() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    // Best-effort: invalidate the refresh token server-side (or mock
    // equivalent). Local state is cleared by the caller regardless of
    // success/failure (offline, already expired, etc.).
    mutationFn: () => impl(source).logout(),
  });
}

export function useRequestEmailVerification() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: () => impl(source).requestEmailVerification(),
    onSuccess: () => toastSuccess("toast.verificationEmailSent"),
    onError: (error) => toastApiError(error),
  });
}

/**
 * No onError toast: the /verify-email page renders its own success/invalid-link
 * state from the result rather than a transient toast.
 */
export function useConfirmEmailVerification() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: VerifyEmailConfirmBody) =>
      impl(source).confirmEmailVerification(body),
  });
}

export function useRequestPasswordReset() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: PasswordResetRequestBody) =>
      impl(source).requestPasswordReset(body),
  });
}

/** No onError toast — see useConfirmEmailVerification. */
export function useConfirmPasswordReset() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: PasswordResetConfirmBody) =>
      impl(source).confirmPasswordReset(body),
  });
}

export function useBankLoginInitiate() {
  const source = useDataSourceStore((s) => s.source);
  return useMutation({
    mutationFn: (body: BankLoginInitiateBody) => impl(source).bankLoginInitiate(body),
    onError: (error) => toastApiError(error),
  });
}

export function useBankLoginCallback() {
  const source = useDataSourceStore((s) => s.source);
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (body: BankLoginCallbackBody) => impl(source).bankLoginCallback(body),
    onSuccess: (tokens) => setTokens({ accessToken: tokens.access_token }),
    onError: (error) => toastApiError(error),
  });
}
