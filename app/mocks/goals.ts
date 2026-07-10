import { delay } from "@/mocks/shared";
import type { FinancialGoal } from "@/types/goal";

let goals: FinancialGoal[] = [
  {
    id: "emergency-fund",
    name: "Emergency Fund",
    current: 45000,
    target: 60000,
    duration: 12,
  },
];

export function getGoals(): Promise<FinancialGoal[]> {
  return delay(goals);
}

export function createGoal(body: Omit<FinancialGoal, "id">): Promise<FinancialGoal> {
  const created: FinancialGoal = { ...body, id: crypto.randomUUID() };
  goals = [...goals, created];
  return delay(created);
}

export function updateGoal(
  id: string,
  patch: Omit<FinancialGoal, "id">,
): Promise<FinancialGoal> {
  goals = goals.map((g) => (g.id === id ? { ...patch, id } : g));
  const updated = goals.find((g) => g.id === id);
  if (!updated) throw new Error(`Goal ${id} not found`);
  return delay(updated);
}

export function deleteGoal(id: string): Promise<void> {
  goals = goals.filter((g) => g.id !== id);
  return delay(undefined);
}
