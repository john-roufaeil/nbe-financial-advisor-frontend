import { delay } from "@/mocks/shared";
import type { StarterTemplate, CreateBudgetBody, Budget } from "@/types/budget";

// Keys match the onboarding template i18n keys; each allocation set sums to 100.
const templates: StarterTemplate[] = [
  {
    template_key: "balanced",
    is_suggested: true,
    allocations: [
      { category: "needs", allocated_percentage: 50 },
      { category: "wants", allocated_percentage: 30 },
      { category: "savings", allocated_percentage: 20 },
    ],
  },
  {
    template_key: "aggressive_savings",
    is_suggested: false,
    allocations: [
      { category: "needs", allocated_percentage: 45 },
      { category: "wants", allocated_percentage: 15 },
      { category: "savings", allocated_percentage: 40 },
    ],
  },
  {
    template_key: "essentials_first",
    is_suggested: false,
    allocations: [
      { category: "needs", allocated_percentage: 65 },
      { category: "wants", allocated_percentage: 15 },
      { category: "savings", allocated_percentage: 20 },
    ],
  },
];

export function getStarterTemplates(): Promise<StarterTemplate[]> {
  return delay(templates);
}

export function createBudget(body: CreateBudgetBody): Promise<Budget> {
  return delay({
    id: crypto.randomUUID(),
    selected_template_key: body.selected_template_key,
    goal: body.goal,
    allocations: body.allocations.map((a) => ({
      ...a,
      allocated_amount: 0,
      currency: "EGP",
    })),
  });
}
