import { apiClient } from "@/api/client";
import type { AuthTokens, SignupBody, LoginBody } from "@/types/auth";

export async function signup(body: SignupBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>("/auth/signup", body);
  return res.data;
}

export async function login(body: LoginBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>("/auth/login", body);
  return res.data;
}

/** Takes NO body — the refresh token rides along as an httpOnly cookie. */
export async function refresh(): Promise<{ access_token: string }> {
  const res = await apiClient.post<{ access_token: string }>("/auth/refresh");
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
