import { create } from "zustand";
import { getFinancialGoals, type FinancialGoal } from "@/lib/demo-financials";

interface GoalsState {
  goals: FinancialGoal[];
  addGoal: (goal: Omit<FinancialGoal, "id">) => void;
  updateGoal: (id: string, goal: Omit<FinancialGoal, "id">) => void;
  removeGoal: (id: string) => void;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: getFinancialGoals(),
  addGoal: (goal) =>
    set((s) => ({ goals: [...s.goals, { ...goal, id: crypto.randomUUID() }] })),
  updateGoal: (id, goal) =>
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...goal, id } : g)) })),
  removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
}));
