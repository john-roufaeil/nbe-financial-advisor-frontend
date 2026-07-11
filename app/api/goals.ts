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

export async function getGoals(): Promise<FinancialGoal[]> {
  const res = await apiClient.get<RawSavingsProgress>("/budget/savings-progress");
  const data = res.data;

  // Make sure the inner goal object exists with a valid name
  if (data.goal && data.goal.name) {
    const target = parseFloat(String(data.goal.target_amount ?? "")) || 0;
    const duration = Number(data.goal.months_remaining) || 0;
    const current = parseFloat(String(data.saved_so_far ?? "")) || 0;

    return [
      {
        id: "primary-goal",
        name: data.goal.name,
        target: target,
        duration: duration,
        current: current,
        percentageComplete: data.percentage_complete,
        onTrack: data.on_track,
      },
    ];
  }
  return [];
}

export async function createGoal(
  body: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  await apiClient.patch("/budget", {
    goal: {
      name: body.name,
      target_amount: body.target,
      target_months: body.duration,
    },
    changed_via: "dashboard",
  });
  return { ...body, id: "primary-goal" };
}

export async function updateGoal(
  id: string,
  patch: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  await apiClient.patch("/budget", {
    goal: {
      name: patch.name,
      target_amount: patch.target,
      target_months: patch.duration,
    },
    changed_via: "dashboard",
  });

  return { id, ...patch };
}

export async function deleteGoal(_id: string): Promise<void> {
  await apiClient.patch("/budget", {
    goal: {
      name: "",
      target_amount: 0,
      target_months: 0,
    },
    changed_via: "dashboard",
  });
}
