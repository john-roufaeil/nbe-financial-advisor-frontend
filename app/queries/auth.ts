import { useMutation } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import type {
  SignupBody,
  LoginBody,
  VerifyEmailConfirmBody,
  PasswordResetRequestBody,
  PasswordResetConfirmBody,
  BankLoginInitiateBody,
  BankLoginCallbackBody,
} from "@/types/auth";
import { useAuthStore } from "@/store/use-auth-store";
import { toastApiError, toastSuccess } from "@/lib/toast";

export function useSignup() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (body: SignupBody) => authApi.signup(body),
    // Store tokens but do NOT flip isAuthenticated — the user isn't "logged in"
    // until the flow completes (so route guards don't bounce a half-onboarded user).
    onSuccess: (tokens) => setTokens({ accessToken: tokens.access_token }),
    // Failure surfaces (no fake success); the caller stays on the step.
    onError: (error) => toastApiError(error),
  });
}

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (body: LoginBody) => authApi.login(body),
    onSuccess: (tokens) => setTokens({ accessToken: tokens.access_token }),
    onError: (error) => toastApiError(error),
  });
}

export function useLogout() {
  return useMutation({
    // Best-effort: invalidate the refresh token server-side. Local state is
    // cleared by the caller regardless of success/failure (offline, already
    // expired, etc.).
    mutationFn: () => authApi.logout(),
  });
}

export function useRequestEmailVerification() {
  return useMutation({
    mutationFn: () => authApi.requestEmailVerification(),
    onSuccess: () => toastSuccess("toast.verificationEmailSent"),
    onError: (error) => toastApiError(error),
  });
}

/**
 * No onError toast: the /verify-email page renders its own success/invalid-link
 * state from the result rather than a transient toast.
 */
export function useConfirmEmailVerification() {
  return useMutation({
    mutationFn: (body: VerifyEmailConfirmBody) => authApi.confirmEmailVerification(body),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (body: PasswordResetRequestBody) => authApi.requestPasswordReset(body),
  });
}

/** No onError toast — see useConfirmEmailVerification. */
export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (body: PasswordResetConfirmBody) => authApi.confirmPasswordReset(body),
  });
}

export function useBankLoginInitiate() {
  return useMutation({
    mutationFn: (body: BankLoginInitiateBody) => authApi.bankLoginInitiate(body),
    onError: (error) => toastApiError(error),
  });
}

export function useBankLoginCallback() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: (body: BankLoginCallbackBody) => authApi.bankLoginCallback(body),
    onSuccess: (tokens) => setTokens({ accessToken: tokens.access_token }),
    onError: (error) => toastApiError(error),
  });
}
