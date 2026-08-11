import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  DashboardFilters,
  DashboardPeriod,
  DashboardSummary,
  IncomeStability,
} from "@/types/dashboard";
import type { Budget } from "@/types/budget";

/** UI period keys → the backend's `?period=` values (ASSUMED BACKEND CHANGE:
 * GET /dashboard must accept `period` and `account_id` query params and
 * compute every metric — inflow, spend, deltas vs the preceding equal window,
 * net worth as-of, and each allocation's percentage_used — over that window
 * and, when given, restricted to that account's transactions). */
const PERIOD_PARAM: Record<DashboardPeriod, string> = {
  thisMonth: "this_month",
  lastMonth: "last_month",
  last3Months: "last_3_months",
  thisYear: "this_year",
};

interface RawAllocation {
  category: string;
  allocated_percentage: number;
  percentage_used: number;
}

interface RawDashboard {
  net_worth?: { total_across_accounts?: number };
  metrics?: {
    current_month_inflow?: number;
    current_month_spend?: number;
    income_stability_score?: number | null;
    previous_month_spend?: number;
    previous_month_inflow?: number;
    spend_change_percentage?: number | null;
    inflow_change_percentage?: number | null;
  };
  allocations_summary?: RawAllocation[];
  has_plan?: boolean;
}

/** Mirrors the backend's own StabilityScoreView thresholds exactly (compute_stability_score, core/views/aggregations.py) — not re-derived, just labeled the same way here. */
function toStability(score: number | null | undefined): IncomeStability | null {
  if (score === null || score === undefined) return null;
  const label = score >= 70 ? "stable" : score >= 40 ? "variable" : "unstable";
  return { score, label };
}

/**
 * `budget` carries the plan's budgeted amount per category. GET /dashboard
 * reports each allocation's `allocated_percentage` and `percentage_used` but
 * NOT its `allocated_amount` — and the amount cannot be rebuilt from the
 * dashboard payload alone (multiplying the percentage by this month's inflow,
 * the obvious guess, collapses to 0 for a user who has a plan but no
 * transactions yet, which then reads as "no plan"). The backend derives the
 * amount from the user's declared monthly income at plan time, and GET
 * /budget is the only endpoint that hands it back.
 *
 * The caller fetches it via the same query key `useBudget()` uses (see
 * `useDashboard`) so the two consumers share one request instead of each
 * firing an independent GET /budget/. `null` means a planless user (an
 * expected 404 there, not an error) — allocated amounts fall back to empty
 * and `has_plan` drives the UI.
 */
export async function getDashboardSummary(
  filters: DashboardFilters,
  budget: Budget | null,
): Promise<DashboardSummary> {
  const allocatedAmounts = new Map(
    (budget?.allocations ?? []).map((alloc) => [
      alloc.category,
      Number(alloc.allocated_amount) || 0,
    ]),
  );
  const res = await apiClient.get<RawDashboard>(API_ENDPOINTS.dashboard, {
    params: {
      period: PERIOD_PARAM[filters.period],
      account_id: filters.accountId,
    },
  });
  const data = res.data;

  // A planless user still gets a 200 with `has_plan: false` and null budget/goal.
  // Treat an empty allocations list as planless too: a budget whose percentages
  // don't add up to anything has nothing to render, and showing an empty donut
  // reads as "you have a plan, it's just all zero".
  const hasPlan = data.has_plan === true && (data.allocations_summary ?? []).length > 0;

  const inflow = data.metrics?.current_month_inflow || 0;
  const spend = data.metrics?.current_month_spend || 0;
  const prevInflow = data.metrics?.previous_month_inflow || 0;
  const prevSpend = data.metrics?.previous_month_spend || 0;

  // Savings rate = the share of income you did NOT spend. This is NOT the
  // backend's income_stability_score (a 0-100 measure of how CONSISTENT income
  // is month to month) — that is a different metric and was previously shown
  // under this label by mistake. Guard against divide-by-zero for a new user.
  const savingsRate = inflow > 0 ? ((inflow - spend) / inflow) * 100 : 0;
  const prevSavingsRate =
    prevInflow > 0 ? ((prevInflow - prevSpend) / prevInflow) * 100 : 0;

  const stats = [
    {
      key: "balance" as const,
      value: data.net_worth?.total_across_accounts || 0,
      // The backend exposes no previous-period net worth, so there is no honest
      // delta to show here. 0 renders a neutral badge rather than a fake trend.
      deltaPct: 0,
      goodDirection: "up" as const,
    },
    {
      key: "income" as const,
      value: inflow,
      deltaPct: Math.round(data.metrics?.inflow_change_percentage ?? 0),
      goodDirection: "up" as const,
    },
    {
      key: "spending" as const,
      value: spend,
      deltaPct: Math.round(data.metrics?.spend_change_percentage ?? 0),
      goodDirection: "down" as const,
    },
    {
      key: "savingsRate" as const,
      value: Math.round(savingsRate),
      deltaPct: Math.round(savingsRate - prevSavingsRate),
      goodDirection: "up" as const,
    },
  ];

  const categories = hasPlan
    ? (data.allocations_summary ?? []).map((alloc) => {
        const budgetAmount = allocatedAmounts.get(alloc.category) ?? 0;
        // percentage_used is already measured against allocated_amount server-side,
        // so it pairs with the amount above rather than with anything recomputed.
        const spentAmount = (alloc.percentage_used / 100) * budgetAmount;
        return {
          name: alloc.category,
          budget: budgetAmount,
          spent: spentAmount,
        };
      })
    : [];

  return {
    currency: "EGP",
    hasPlan,
    stats,
    budget: { categories },
    stability: toStability(data.metrics?.income_stability_score),
  };
}
