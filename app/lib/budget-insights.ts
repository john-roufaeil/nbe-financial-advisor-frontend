import type { BudgetProgress } from "@/types/budget";
import type { MonthlySummary } from "@/types/analytics";
import { isSavingsCategory } from "@/lib/budget-category-semantics";

export type InsightTone = "critical" | "warning" | "positive" | "neutral";

/**
 * A derived, analytical statement (not a raw value) — the point of
 * app/components/budget/BudgetInsights.tsx. `key` is an i18n key under
 * budget.insights.*; `category` (a raw category name, not yet translated)
 * is resolved separately by the caller, which has `t` and can route it
 * through common.categories.* before interpolating.
 */
export interface BudgetInsight {
  id: string;
  tone: InsightTone;
  key: string;
  params?: { category?: string; percent?: number; count?: number };
}

/** Caps the grid at a clean 2x2 on larger screens — see computeBudgetInsights. */
const MAX_INSIGHTS = 4;

/**
 * Pure and React-free on purpose — no i18n calls here, just the analysis.
 * Feed it whatever of its two optional sources are loaded; each section
 * degrades independently (e.g. a first-ever month has no `previousSummary`
 * to compare against, but still gets the progress-based insights).
 *
 * Pushed in priority order (most actionable/severe first), then capped at
 * MAX_INSIGHTS — with up to 7 possible candidates, showing all of them at
 * once would bury the ones that actually matter.
 */
export function computeBudgetInsights({
  progress,
  currentSummary,
  previousSummary,
}: {
  progress?: BudgetProgress;
  currentSummary?: MonthlySummary;
  previousSummary?: MonthlySummary;
}): BudgetInsight[] {
  const insights: BudgetInsight[] = [];

  if (progress) {
    // "savings" is handled entirely separately below — for every other
    // category a lower percentageUsed is better, but for savings actual
    // spend IS money saved, so it inverts the whole good/bad direction
    // (see lib/budget-category-semantics.ts). Mixing it into these
    // lower-is-better/higher-is-worse reduces would misreport a healthy,
    // fully-funded savings category as the month's biggest problem.
    const spendCategories = progress.categories.filter(
      (c) => !isSavingsCategory(c.category),
    );
    const savings = progress.categories.find((c) => isSavingsCategory(c.category));

    const overBudget = spendCategories.filter((c) => c.status === "over_budget");
    if (overBudget.length > 0) {
      const worst = overBudget.reduce((a, b) =>
        a.percentageUsed > b.percentageUsed ? a : b,
      );
      insights.push({
        id: "over-budget",
        tone: "critical",
        key:
          overBudget.length > 1
            ? "budget.insights.overBudgetMultiple"
            : "budget.insights.overBudgetOne",
        params: {
          category: worst.category,
          percent: Math.round(worst.percentageUsed),
          count: overBudget.length,
        },
      });
    }

    const approaching = spendCategories.filter((c) => c.status === "approaching_limit");
    if (approaching.length > 0) {
      const worst = approaching.reduce((a, b) =>
        a.percentageUsed > b.percentageUsed ? a : b,
      );
      insights.push({
        id: "approaching",
        tone: "warning",
        key: "budget.insights.approaching",
        params: { category: worst.category, percent: Math.round(worst.percentageUsed) },
      });
    }

    // Dedicated, inverted-polarity insight: hitting/exceeding the savings
    // target is the good outcome here, not a warning sign.
    if (savings && savings.allocatedAmount > 0) {
      const percent = Math.round(savings.percentageUsed);
      insights.push(
        savings.percentageUsed >= 100
          ? {
              id: "savings-goal",
              tone: "positive",
              key: "budget.insights.savingsReached",
              params: { percent },
            }
          : savings.percentageUsed >= 80
            ? {
                id: "savings-goal",
                tone: "positive",
                key: "budget.insights.savingsClose",
                params: { percent },
              }
            : {
                id: "savings-goal",
                tone: "warning",
                key: "budget.insights.savingsBehind",
                params: { percent },
              },
      );
    }

    const withBudget = spendCategories.filter((c) => c.allocatedAmount > 0);
    const totalAllocated = withBudget.reduce((sum, c) => sum + c.allocatedAmount, 0);
    const totalActual = withBudget.reduce((sum, c) => sum + c.actualAmount, 0);
    if (totalAllocated > 0) {
      const utilization = (totalActual / totalAllocated) * 100;
      insights.push({
        id: "utilization",
        tone: utilization > 100 ? "critical" : utilization >= 80 ? "warning" : "positive",
        key: "budget.insights.utilization",
        params: { percent: Math.round(utilization) },
      });
    }

    if (withBudget.length > 0) {
      const best = withBudget.reduce((a, b) =>
        a.percentageUsed < b.percentageUsed ? a : b,
      );
      if (best.status === "on_track" && best.percentageUsed < 50) {
        insights.push({
          id: "best-controlled",
          tone: "positive",
          key: "budget.insights.bestControlled",
          params: { category: best.category, percent: Math.round(best.percentageUsed) },
        });
      }
    }

    // Skipped if it's the same category an over-budget/approaching insight
    // above already named — saying so twice in different words is noise,
    // not a second insight.
    const alreadyNamed = new Set(insights.map((i) => i.params?.category).filter(Boolean));
    const withSpend = spendCategories.filter((c) => c.actualAmount > 0);
    if (withSpend.length > 0) {
      const top = withSpend.reduce((a, b) => (a.actualAmount > b.actualAmount ? a : b));
      if (!alreadyNamed.has(top.category)) {
        insights.push({
          id: "top-spend",
          tone: "neutral",
          key: "budget.insights.topSpend",
          params: { category: top.category },
        });
      }
    }
  }

  if (currentSummary && previousSummary) {
    const currentNet = currentSummary.totalInflow - currentSummary.totalSpend;
    const previousNet = previousSummary.totalInflow - previousSummary.totalSpend;
    if (previousNet !== 0) {
      const deltaPct = ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
      if (Math.abs(deltaPct) >= 5) {
        insights.push({
          id: "net-trend",
          tone: deltaPct > 0 ? "positive" : "warning",
          key: deltaPct > 0 ? "budget.insights.netUp" : "budget.insights.netDown",
          params: { percent: Math.round(Math.abs(deltaPct)) },
        });
      }
    } else if (currentNet > 0) {
      insights.push({
        id: "net-trend",
        tone: "positive",
        key: "budget.insights.netTurnedPositive",
      });
    }
  }

  return insights.slice(0, MAX_INSIGHTS);
}
