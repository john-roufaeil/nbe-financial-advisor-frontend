import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
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

export async function signup(body: SignupBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>(API_ENDPOINTS.authSignup, body);
  return res.data;
}

export async function login(body: LoginBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>(API_ENDPOINTS.authLogin, body);
  return res.data;
}

/** Takes NO body — the refresh token rides along as an httpOnly cookie. */
export async function refresh(): Promise<{ access_token: string }> {
  const res = await apiClient.post<{ access_token: string }>(API_ENDPOINTS.authRefresh);
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authLogout);
}

/** Ends every OTHER session for the current user — the calling device
 * stays signed in. Profile page's Account Management section. */
export async function logoutAllDevices(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authLogoutAll);
}

/** IsAuthenticated — resends the verification email to the current user. */
export async function requestEmailVerification(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authVerifyEmailRequest);
}

export async function confirmEmailVerification(
  body: VerifyEmailConfirmBody,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authVerifyEmailConfirm, body);
}

export async function requestPasswordReset(
  body: PasswordResetRequestBody,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authPasswordResetRequest, body);
}

export async function confirmPasswordReset(
  body: PasswordResetConfirmBody,
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authPasswordResetConfirm, body);
}

export async function bankLoginInitiate(
  body: BankLoginInitiateBody,
): Promise<BankLoginInitiateResponse> {
  const res = await apiClient.post<BankLoginInitiateResponse>(
    API_ENDPOINTS.authBankLoginInitiate,
    body,
  );
  return res.data;
}

export async function bankLoginCallback(
  body: BankLoginCallbackBody,
): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>(API_ENDPOINTS.authBankLoginCallback, body);
  return res.data;
}
