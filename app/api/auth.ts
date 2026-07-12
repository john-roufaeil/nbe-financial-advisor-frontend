import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { AuthTokens, SignupBody, LoginBody, RefreshBody } from "@/types/auth";

// res.data is already the unwrapped payload (client.ts strips the { data } envelope).
export async function signup(body: SignupBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>(API_ENDPOINTS.authSignup, body);
  return res.data;
}

export async function login(body: LoginBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>(API_ENDPOINTS.authLogin, body);
  return res.data;
}

export async function refresh(body: RefreshBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>(API_ENDPOINTS.authRefresh, body);
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post(API_ENDPOINTS.authLogout);
}
