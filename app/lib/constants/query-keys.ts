/** React Query cache key roots — the first segment of every query/mutation key. */
export const QUERY_ROOTS = {
  accounts: "accounts",
  transactions: "transactions",
  bankStatements: "bankStatements",
  budget: "budget",
  dashboard: "dashboard",
  goals: "goals",
  profile: "profile",
} as const;
