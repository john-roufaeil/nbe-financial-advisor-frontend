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
  /** Human-readable copy supplied by the backend — do not hardcode in i18n. */
  name: string;
  description: string;
  is_suggested: boolean;
  allocations: AllocationInput[];
}

/**
 * A budget has NO goal. A savings goal is a completely separate backend entity
 * with its own endpoints (/goal, /dashboard/goal) — see app/api/goals.ts.
 * Do not add a `goal` field back to any of these interfaces.
 */
export interface CreateBudgetBody {
  selected_template_key: string;
  /** Percentages, must sum to 100 (backend rejects with 422 otherwise). */
  allocations: AllocationInput[];
}

export interface Budget {
  id: string;
  name?: string;
  selected_template_key: string;
  allocations: Allocation[];
}

/** PATCH /budget body — any subset of fields may be sent; unset fields are left unchanged. */
export interface UpdateBudgetBody {
  name?: string;
  /** Percentages, must sum to 100 when provided (backend rejects with 422 otherwise). */
  allocations?: AllocationInput[];
  changed_via: "dashboard" | "chat";
}

export interface BudgetHistoryAllocationSnapshot {
  category: string;
  allocatedPercentage: number;
  allocatedAmount: number;
}

/**
 * One row of GET /budget/history — `previousAllocations` is the plan's
 * state immediately BEFORE this change was applied (a snapshot, not a
 * diff), newest change first.
 */
export interface BudgetHistoryEntry {
  id: string;
  previousAllocations: BudgetHistoryAllocationSnapshot[];
  changedVia: "dashboard" | "chat" | "onboarding";
  changedAt: string;
}

export const BUDGET_PROGRESS_STATUSES = [
  "on_track",
  "approaching_limit",
  "over_budget",
] as const;
export type BudgetProgressStatus = (typeof BUDGET_PROGRESS_STATUSES)[number];

export interface BudgetProgressCategory {
  category: string;
  allocatedAmount: number;
  actualAmount: number;
  percentageUsed: number;
  status: BudgetProgressStatus;
}

/** GET /budget/progress — per-category spend-vs-allocation for one calendar month. */
export interface BudgetProgress {
  period: string;
  categories: BudgetProgressCategory[];
}
