import { delay } from "@/mocks/shared";
import type { FinancialGoal } from "@/types/goal";

let goals: FinancialGoal[] = [
  { id: "emergency-fund", name: "Emergency Fund", current: 45000, target: 60000 },
  { id: "new-car", name: "New Car", current: 18000, target: 150000 },
  { id: "vacation", name: "Vacation", current: 8000, target: 20000 },
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
