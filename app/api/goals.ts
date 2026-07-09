import { apiClient } from "@/api/client";
import type { FinancialGoal } from "@/types/goal";

interface RawGoalDashboard {
  goal?: {
    name?: string;
    target_amount?: string | number;
    target_months?: number; // Backend property name
    percentage_complete?: number;
  };
}

export async function getGoals(): Promise<FinancialGoal[]> {
  const res = await apiClient.get<RawGoalDashboard>("/dashboard");
  const data = res.data;

  // Make sure the inner goal object exists with a valid name
  if (data.goal && data.goal.name) {
    const target = parseFloat(String(data.goal.target_amount ?? "")) || 0;
    const duration = Number(data.goal.target_months) || 12; // Fallback default if empty

    // Derived from your previous component math: current = target * (percentage / 100)
    const percentage = data.goal.percentage_complete || 0;
    const current = Math.round(target * (percentage / 100));

    return [
      {
        id: "primary-goal",
        name: data.goal.name,
        target: target,
        duration: duration,
        current: current, // Keeps your UI milestones from breaking!
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
      target_months: body.duration, // Sent cleanly to backend mapping
    },
  };
  await apiClient.patch("/dashboard/goal/", patchData);
  return { ...body, id: "primary-goal" };
}

export async function updateGoal(
  id: string,
  patch: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  // Fetch existing goal parameters so we can preserve untouched fields
  const currentGoals = await getGoals();
  const existingGoal = currentGoals[0] || {
    name: "",
    current: 0,
    target: 0,
    duration: 12,
  };

  const updatedName = patch.name ?? existingGoal.name;
  const updatedTarget = patch.target ?? existingGoal.target;
  const updatedDuration = patch.duration ?? existingGoal.duration;

  const patchData = {
    goal: {
      name: updatedName,
      target_amount: updatedTarget,
      target_months: updatedDuration,
    },
  };

  await apiClient.patch("/dashboard/goal/", patchData);

  return {
    id: "primary-goal",
    name: updatedName,
    target: updatedTarget,
    duration: updatedDuration,
    current: existingGoal.current, // Maintain the computed progress local state value
  };
}

export async function deleteGoal(_id: string): Promise<void> {
  // Clearing out single global fields on the mock payload
  const patchData = {
    goal: {
      name: "",
      target_amount: 0,
      target_months: 12,
    },
  };
  await apiClient.patch("/dashboard/goal/", patchData);
}
