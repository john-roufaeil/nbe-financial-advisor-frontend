import { delay } from "@/mocks/shared";
import type { AuthTokens, SignupBody, LoginBody } from "@/types/auth";

function mockTokens(subject: string): AuthTokens {
  return {
    access_token: `mock-access-token.${subject}`,
    refresh_token: `mock-refresh-token.${subject}`,
  };
}

export function signup(body: SignupBody): Promise<AuthTokens> {
  return delay(mockTokens(body.email));
}

export function login(body: LoginBody): Promise<AuthTokens> {
  return delay(mockTokens(body.email));
}

export function logout(): Promise<void> {
  return delay(undefined);
}
