import { apiClient } from "@/api/client";
import type { AuthTokens, SignupBody, LoginBody } from "@/types/auth";

// res.data is already the unwrapped payload (client.ts strips the { data } envelope).
export async function signup(body: SignupBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>("/auth/signup", body);
  return res.data;
}

export async function login(body: LoginBody): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>("/auth/login", body);
  return res.data;
}
