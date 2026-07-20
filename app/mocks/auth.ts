import { delay } from "@/mocks/shared";
import type {
  AuthTokens,
  SignupBody,
  LoginBody,
  VerifyEmailConfirmBody,
  PasswordResetRequestBody,
  PasswordResetConfirmBody,
  BankLoginInitiateBody,
  BankLoginInitiateResponse,
  BankLoginCallbackBody,
} from "@/types/auth";

function mockTokens(subject: string): AuthTokens {
  return {
    access_token: `mock-access-token.${subject}`,
    user_id: `mock-user.${subject}`,
  };
}

export function signup(body: SignupBody): Promise<AuthTokens> {
  return delay(mockTokens(body.email));
}

export function login(body: LoginBody): Promise<AuthTokens> {
  return delay(mockTokens(body.email));
}

export function refresh(): Promise<{ access_token: string }> {
  return delay({ access_token: "mock-access-token.refreshed" });
}

export function logout(): Promise<void> {
  return delay(undefined);
}

export function requestEmailVerification(): Promise<void> {
  return delay(undefined);
}

export function confirmEmailVerification(_body: VerifyEmailConfirmBody): Promise<void> {
  return delay(undefined);
}

export function requestPasswordReset(_body: PasswordResetRequestBody): Promise<void> {
  return delay(undefined);
}

export function confirmPasswordReset(_body: PasswordResetConfirmBody): Promise<void> {
  return delay(undefined);
}

export function bankLoginInitiate(
  body: BankLoginInitiateBody,
): Promise<BankLoginInitiateResponse> {
  return delay({
    state: `mock-state.${body.provider_slug}`,
    authorize_url: `https://mock-bank-oauth.local/authorize?provider=${body.provider_slug}`,
  });
}

export function bankLoginCallback(_body: BankLoginCallbackBody): Promise<AuthTokens> {
  return delay(mockTokens("mock-bank-customer"));
}
