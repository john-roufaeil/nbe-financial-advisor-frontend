import { delay } from "@/mocks/shared";
import type { AuthTokens, SignupBody, LoginBody } from "@/types/auth";

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
