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
}
