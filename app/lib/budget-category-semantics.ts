import type { BudgetProgressStatus } from "@/types/budget";

/**
 * For every category except "savings", less spent (a lower percentageUsed)
 * is better — that's what BudgetProgressStatus's on_track/approaching_limit/
 * over_budget already encodes. "savings" inverts this: its actual_amount is
 * the sum of debit transactions categorized as "savings" (core/views/budgets.py's
 * BudgetProgressView) — i.e. money actually moved INTO savings — so reaching
 * or exceeding the allocation is the goal, not a problem.
 */
export function isSavingsCategory(category: string): boolean {
  return category === "savings";
}

export type StatusSentiment = "good" | "watch" | "bad";

/** How a category's raw backend status should actually read to the user —
 * flipped for "savings", passthrough for everything else. */
export function statusSentiment(
  category: string,
  status: BudgetProgressStatus,
): StatusSentiment {
  if (isSavingsCategory(category)) {
    return status === "over_budget"
      ? "good"
      : status === "approaching_limit"
        ? "watch"
        : "bad";
  }
  return status === "on_track"
    ? "good"
    : status === "approaching_limit"
      ? "watch"
      : "bad";
}
