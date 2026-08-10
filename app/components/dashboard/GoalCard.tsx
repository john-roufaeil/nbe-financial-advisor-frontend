import { useRef } from "react";
import {
  Target,
  Pencil,
  CheckCircle2,
  Circle,
  TrendingUp,
  TriangleAlert,
  Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FinancialGoal } from "@/types/goal";
import { useGoals } from "@/queries/goals";
import { formatDate } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { GoalsEditModal } from "@/components/dashboard/GoalsEditModal";
import { ErrorState, GoalEmptyState } from "@/components/shared/QueryState";
import { SkeletonTimelineRow } from "@/components/shared/skeletons/SkeletonRows";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";

function GoalMilestones({ goal, currency }: { goal: FinancialGoal; currency: string }) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const currentPct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const currencyLabel = t(`currency.${currency}`, currency);

  const milestones = [
    { pct: 25, label: "25%" },
    { pct: 50, label: "50%" },
    { pct: 75, label: "75%" },
    { pct: 100, label: "100%" },
  ];

  const calculateLineHeight = () => {
    if (currentPct <= 25) return "0%";
    if (currentPct >= 100) return "100%";
    return `${((currentPct - 25) / 75) * 100}%`;
  };

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-base-content text-2xl font-bold tracking-tight">
            {currentPct}%{" "}
            <span className="text-base-content/50 text-xs font-medium tracking-wider uppercase">
              {t("dashboard.goals.current")}
            </span>
          </span>
          {currentPct >= 100 ? (
            <span className="bg-success/10 text-success inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
              <CheckCircle2 data-no-flip className="size-3" />
              {t("dashboard.goals.completed")}
            </span>
          ) : (
            goal.onTrack !== undefined && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  goal.onTrack
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {goal.onTrack ? (
                  <TrendingUp data-no-flip className="size-3" />
                ) : (
                  <TriangleAlert data-no-flip className="size-3" />
                )}
                {goal.onTrack
                  ? t("dashboard.goals.onTrack")
                  : t("dashboard.goals.behindSchedule")}
              </span>
            )
          )}
        </div>
        <p className="text-base-content/60 text-xs">
          <Money className="text-base-content inline font-semibold">
            {formatN(goal.current)}
          </Money>{" "}
          / <Money className="inline">{formatN(goal.target)}</Money> {currencyLabel}
        </p>
        {goal.projectedCompletionDate && (
          <div className="bg-base-200/60 text-base-content/60 mt-0.5 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
            <Calendar data-no-flip className="size-3" />
            {t("dashboard.goals.projectedCompletion", {
              date: formatDate(goal.projectedCompletionDate, dateFormat),
            })}
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-4">
        {/* rem, not px: the milestone circles below are `size-7` (1.75rem),
            which grow with the app's font-scale setting (see
            html[data-a11y-font-scale] in app.css). A fixed-px offset here
            would stay pinned to its original position while the circles
            grow around it, drifting off-center at high scale (e.g. 200%). */}
        <div className="bg-base-200 absolute inset-s-3.25 top-3.5 bottom-3.5 w-0.5 overflow-hidden rounded-full">
          <div
            className="bg-primary w-full origin-top rounded-full transition-[height] duration-500 ease-out"
            style={{ height: calculateLineHeight() }}
          />
        </div>

        {milestones.map((milestone, idx) => {
          const isCompleted = currentPct >= milestone.pct;
          const isNextUp =
            currentPct < milestone.pct &&
            (idx === 0 || currentPct >= milestones[idx - 1].pct);

          return (
            <div
              key={milestone.pct}
              className="relative grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-4"
            >
              <div className="bg-base-100 relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full">
                {isCompleted ? (
                  <CheckCircle2
                    data-no-flip
                    className="text-primary fill-primary/10 size-5.5"
                  />
                ) : (
                  <Circle
                    className={`size-5 transition-colors duration-300 ${isNextUp ? "text-primary stroke-[2.5]" : "text-base-content/20"}`}
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-col">
                <span
                  className={`text-sm font-semibold transition-colors duration-300 ${isCompleted ? "text-base-content" : isNextUp ? "text-primary" : "text-base-content/40"}`}
                >
                  {milestone.label}
                </span>
                <span className="text-base-content/40 text-xs wrap-break-word">
                  <Money className="inline">
                    {formatN(Math.round(goal.target * (milestone.pct / 100)))}
                  </Money>{" "}
                  {currencyLabel}
                </span>
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${
                    isCompleted
                      ? "bg-success/10 text-success"
                      : isNextUp
                        ? "bg-primary/10 text-primary animate-pulse"
                        : "bg-base-200/50 text-base-content/30"
                  }`}
                >
                  {isCompleted
                    ? t("dashboard.goals.status.reached", "Reached")
                    : isNextUp
                      ? t("dashboard.goals.status.next", "Next Up")
                      : t("dashboard.goals.status.locked", "Locked")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GoalCardSkeleton() {
  return (
    <div className="card border-base-300 bg-base-100 animate-entry h-full border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Target className="size-4.5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="card-title line-clamp-1 text-base leading-tight">
              <div className="bg-base-200 h-4 w-24 animate-pulse rounded" />
            </h2>
          </div>
        </div>

        <SkeletonTimelineRow />
      </div>
    </div>
  );
}

export function GoalCard({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const { data: goals, isPending, isError, refetch } = useGoals();
  const modalRef = useRef<HTMLDialogElement>(null);
  const goal = goals?.[0];

  if (isPending) {
    return <GoalCardSkeleton />;
  }

  return (
    <div className="card border-base-300 bg-base-100 animate-entry h-full border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Target className="size-4.5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="card-title line-clamp-1 text-base leading-tight">
              {goal && goal.name && goal.name !== "Not provided"
                ? goal.name
                : t("dashboard.goals.titleShort")}
            </h2>
          </div>
          {goal && (
            <Tooltip content={t("dashboard.goals.editTitle")}>
              <button
                type="button"
                onClick={() => modalRef.current?.showModal()}
                className="btn btn-ghost btn-sm btn-square"
                aria-label={t("dashboard.goals.editTitle")}
              >
                <Pencil data-no-flip className="size-4" />
              </button>
            </Tooltip>
          )}
        </div>

        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : goal && goal.target ? (
          <GoalMilestones goal={goal} currency={currency} />
        ) : (
          <GoalEmptyState onAddClick={() => modalRef.current?.showModal()} />
        )}
      </div>
      <GoalsEditModal ref={modalRef} goal={goal} />
    </div>
  );
}
