import { apiClient } from "@/api/client";
import type { FinancialGoal } from "@/types/goal";

interface RawGoalDashboard {
  goal?: {
    name?: string;
    target_amount?: string | number;
    percentage_complete?: number;
  };
}

export async function getGoals(): Promise<FinancialGoal[]> {
  const res = await apiClient.get<RawGoalDashboard>("/dashboard");
  const data = res.data;

  if (data.goal && data.goal.name) {
    const target = parseFloat(String(data.goal.target_amount ?? "")) || 0;
    // Calculate current saved amount based on percentage and target
    const current = ((data.goal.percentage_complete ?? 0) / 100) * target;
    return [
      {
        id: "primary-goal",
        name: data.goal.name,
        current: current,
        target: target,
      },
    ];
  }
  return [];
}

export async function createGoal(
  body: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  const patchData = {
    goal: {
      name: body.name,
      target_amount: body.target,
      target_months: 12, // Backend requires target_months
    },
  };
  await apiClient.patch("/dashboard/goal/", patchData);
  return { ...body, id: "primary-goal" };
}

export async function updateGoal(
  id: string,
  patch: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  // We only support one goal, so we fetch the current to retain unaffected fields
  const current = await getGoals();
  const goal = current[0] || { name: "", current: 0, target: 0 };
  const updatedName = patch.name ?? goal.name;
  const updatedTarget = patch.target ?? goal.target;

  const patchData = {
    goal: {
      name: updatedName,
      target_amount: updatedTarget,
      target_months: 12,
    },
  };
  await apiClient.patch("/dashboard/goal/", patchData);
  return {
    id: "primary-goal",
    name: updatedName,
    current: goal.current,
    target: updatedTarget,
  };
}

export async function deleteGoal(_id: string): Promise<void> {
  // Clear out the single goal fields
  const patchData = {
    goal: {
      name: "",
      target_amount: 0,
      target_months: 12,
    },
  };
  await apiClient.patch("/dashboard/goal/", patchData);
}
