/** Backend endpoint paths (relative to VITE_API_BASE_URL). */
export const API_ENDPOINTS = {
  accounts: "/accounts",
  account: (id: string) => `/accounts/${id}`,
  transactions: "/transactions",
  transaction: (id: string) => `/transactions/${id}`,
  statements: "/statements",
  statement: (id: string) => `/statements/${id}`,
  dashboard: "/dashboard",
  budget: "/budget",
  budgetStarterTemplates: "/budget/starter-templates",
  savingsProgress: "/budget/savings-progress",
  usersMe: "/users/me",
  authSignup: "/auth/signup",
  authLogin: "/auth/login",
  authRefresh: "/auth/refresh",
  authLogout: "/auth/logout",
} as const;
