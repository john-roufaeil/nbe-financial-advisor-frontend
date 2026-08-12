import { CalendarClock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGoals } from "@/queries/goals";

/** Countdown to the active goal's projected completion date — GoalCard shows
 * that date formatted out, but never as a day count. Reuses the same
 * useGoals() query that card already fetches. Hidden with no goal, no
 * projection yet, or a projection already in the past. */
export function DaysToGoalCard() {
  const { t } = useTranslation();
  const { data: goals } = useGoals();
  const goal = goals?.[0];
  if (!goal?.projectedCompletionDate) return null;

  const days = Math.ceil(
    (new Date(goal.projectedCompletionDate).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24),
  );
  if (days < 0) return null;

  return (
    <div className="card border-base-300 bg-base-100 animate-entry h-full w-full border shadow-sm">
      <div className="flex items-center gap-2 p-3">
        <span className="bg-info/10 text-info grid size-8 shrink-0 place-items-center rounded-lg">
          <CalendarClock data-no-flip className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base-content/60 truncate text-xs">
            {t("dashboard.daysToGoal.label")}
          </p>
          <p className="text-base font-semibold tabular-nums">
            {t("dashboard.daysToGoal.days", { count: days })}
          </p>
        </div>
      </div>
    </div>
  );
}
