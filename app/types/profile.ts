/** Fields collected at onboarding step 2 — PATCH /users/me sends only these. */
export interface UpdateProfileBody {
  employment_status?: string;
  monthly_income?: string;
  income_steadiness?: string;
  dependents_count?: string;
}

/** Minimal shape of the authenticated user returned by /users/me. */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  employment_status?: string;
  monthly_income?: string;
  income_steadiness?: string;
  dependents_count?: string;
  /** False for bank-login-created accounts (no password ever set) — see VerifyEmailBanner. */
  has_password: boolean;
  /** True once the emailed verification link was clicked — bank-login accounts never send that email, so this stays false for them regardless. See VerifyEmailBanner. */
  email_verified: boolean;
}
