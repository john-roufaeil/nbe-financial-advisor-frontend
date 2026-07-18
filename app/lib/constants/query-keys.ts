/** React Query cache key roots — the first segment of every query/mutation key. */
export const QUERY_ROOTS = {
  accounts: "accounts",
  transactions: "transactions",
  bankStatements: "bankStatements",
  budget: "budget",
  categories: "categories",
  dashboard: "dashboard",
  goals: "goals",
  profile: "profile",
  admin: "admin",
  chat: "chat",
} as const;
