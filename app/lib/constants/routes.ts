/** URL path segments (appended after the `/:lang` prefix). */
export const ROUTE_SEGMENTS = {
  dashboard: "dashboard",
  chat: "chat",
  transactions: "transactions",
  bankStatements: "bank-statements",
  budget: "budget",
  recommendations: "recommendations",
  profile: "profile",
  onboarding: "onboarding",
  signIn: "sign-in",
  admin: "admin",
  adminDashboard: "admin/dashboard",
} as const;

/** Builds an in-app path for the given language. */
export const localizedPath = (lang: string, segment?: string) =>
  segment ? `/${lang}/${segment}` : `/${lang}`;
