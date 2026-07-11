import { delay } from "@/mocks/shared";
import type {
  StarterTemplate,
  CreateBudgetBody,
  UpdateBudgetBody,
  Budget,
} from "@/types/budget";

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

let budget: Budget = {
  id: "primary-budget",
  name: "My Budget",
  selected_template_key: "balanced",
  goal: { name: "Emergency Fund", target_amount: 60000, target_months: 12 },
  allocations: [
    {
      category: "needs",
      allocated_percentage: 50,
      allocated_amount: 15000,
      currency: "EGP",
    },
    {
      category: "wants",
      allocated_percentage: 30,
      allocated_amount: 9000,
      currency: "EGP",
    },
    {
      category: "savings",
      allocated_percentage: 20,
      allocated_amount: 6000,
      currency: "EGP",
    },
  ],
};

export function createBudget(body: CreateBudgetBody): Promise<Budget> {
  budget = {
    id: budget.id,
    selected_template_key: body.selected_template_key,
    goal: body.goal,
    allocations: body.allocations.map((a) => ({
      ...a,
      allocated_amount: 0,
      currency: "EGP",
    })),
  };
  return delay(budget);
}

export function getBudget(): Promise<Budget> {
  return delay(budget);
}

export function updateBudget(body: UpdateBudgetBody): Promise<Budget> {
  budget = {
    ...budget,
    name: body.name ?? budget.name,
    goal: body.goal ?? budget.goal,
    allocations: body.allocations
      ? body.allocations.map((a) => ({
          ...a,
          allocated_amount: Math.round(
            budget.goal.target_amount * (a.allocated_percentage / 100),
          ),
          currency: budget.allocations[0]?.currency ?? "EGP",
        }))
      : budget.allocations,
  };
  return delay(budget);
}
