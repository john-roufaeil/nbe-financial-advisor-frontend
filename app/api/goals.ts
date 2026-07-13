import { apiClient } from "@/api/client";
import type { FinancialGoal } from "@/types/goal";

interface RawSavingsProgress {
  goal?: {
    name?: string;
    target_amount?: string | number;
    months_remaining?: number;
  };
  saved_so_far?: string | number;
  percentage_complete?: number;
  projected_completion_date?: string;
  on_track?: boolean;
}

/**
 * Read side. GET /budget/savings-progress 404s when no goal exists — that is the
 * documented "no goal yet" answer, not an error, so it maps to an empty list.
 */
export async function getGoals(): Promise<FinancialGoal[]> {
  try {
    const res = await apiClient.get<RawSavingsProgress>("/budget/savings-progress");
    const data = res.data;

    if (data.goal && data.goal.name) {
      return [
        {
          id: "primary-goal",
          name: data.goal.name,
          target: parseFloat(String(data.goal.target_amount ?? "")) || 0,
          duration: Number(data.goal.months_remaining) || 0,
          current: parseFloat(String(data.saved_so_far ?? "")) || 0,
          percentageComplete: data.percentage_complete,
          projectedCompletionDate: data.projected_completion_date,
          onTrack: data.on_track,
        },
      ];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Write side. PATCH /dashboard/goal is an UPSERT — it creates the goal if none
 * exists and updates it if one does — so create and update are the same call.
 * The body is wrapped in a top-level `goal` key. There is only ever ONE goal per
 * user, hence the fixed "primary-goal" id.
 *
 * NOTE: goals do NOT live on the budget. Do not send them to PATCH /budget —
 * that endpoint has no `goal` field and will silently discard it.
 */
async function upsertGoal(body: Omit<FinancialGoal, "id">): Promise<FinancialGoal> {
  await apiClient.patch("/dashboard/goal", {
    goal: {
      name: body.name,
      target_amount: body.target,
      target_months: body.duration,
    },
  });
  return { ...body, id: "primary-goal" };
}

export async function createGoal(
  body: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  return upsertGoal(body);
}

export async function updateGoal(
  _id: string,
  patch: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  return upsertGoal(patch);
}

export async function deleteGoal(_id: string): Promise<void> {
  await apiClient.delete("/goal");
}
