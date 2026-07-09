/**
 * Allocation convention (API Design Guidelines §4): the client SENDS only
 * percentages; the backend derives and stores the amount and echoes back
 * percentage + amount + currency on every response.
 */
export interface AllocationInput {
  category: string;
  allocated_percentage: number;
}

export interface Allocation extends AllocationInput {
  allocated_amount: number;
  currency: string;
}

export interface StarterTemplate {
  template_key: string;
  is_suggested: boolean;
  allocations: AllocationInput[];
}

/** Goal object convention (§5): same shape everywhere a goal is written. */
export interface BudgetGoal {
  name: string;
  target_amount: number;
  target_months: number;
}

export interface CreateBudgetBody {
  selected_template_key: string;
  goal: BudgetGoal;
  /** Percentages, must sum to 100 (backend rejects with 422 otherwise). */
  allocations: AllocationInput[];
}

export interface Budget {
  id: string;
  selected_template_key: string;
  goal: BudgetGoal;
  allocations: Allocation[];
}
