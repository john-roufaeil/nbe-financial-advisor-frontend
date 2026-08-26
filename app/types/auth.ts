/**
 * The backend returns ONLY an access token in the body. The refresh token is set
 * as an httpOnly cookie the browser stores and sends automatically — it is never
 * readable by JavaScript, so there is nothing to type or store for it here.
 */
export interface AuthTokens {
  access_token: string;
  user_id: string;
}

export interface SignupBody {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

/**
 * `t` is the opaque, single-use link ticket from the query string of the
 * emailed verification link (?t=...) — NOT the raw user_id/token pair;
 * those never reach the client, the backend resolves the ticket server-side
 * (services/link_tickets.py).
 */
export interface VerifyEmailConfirmBody {
  t: string;
}

export interface PasswordResetRequestBody {
  email: string;
}

/** `t` — same opaque link ticket as VerifyEmailConfirmBody, from the emailed reset link. */
export interface PasswordResetConfirmBody {
  t: string;
  new_password: string;
}

export interface BankLoginInitiateBody {
  provider_slug: string;
}

export interface BankLoginInitiateResponse {
  state: string;
  authorize_url: string;
}

export interface BankLoginCallbackBody {
  code: string;
  state: string;
}
