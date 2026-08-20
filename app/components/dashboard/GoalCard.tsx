import { useRef, useState } from "react";
import {
  Target,
  Pencil,
  CheckCircle2,
  TrendingUp,
  TriangleAlert,
  Calendar,
  Check,
  PartyPopper,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FinancialGoal } from "@/types/goal";
import { useGoals } from "@/queries/goals";
import { formatDate } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { GoalsEditModal } from "@/components/dashboard/GoalsEditModal";
import { ErrorState, GoalEmptyState } from "@/components/shared/QueryState";
import { Money } from "@/components/shared/Money";
import { Tooltip } from "@/components/shared/Tooltip";

/** A single progress bar + the key numbers, laid out as one wrapping
 * horizontal row — replaces the old four-stop milestone timeline (which
 * packed a lot of repeated detail into a narrow column) now that this card
 * spans the full width above Budget/Activity instead of sharing a row with
 * them (see dashboard.tsx: their heights differ too much to share a grid
 * row without leaving Goal's column dead space below it). */
function GoalProgress({
  goal,
  currency,
  onSetNewGoal,
}: {
  goal: FinancialGoal;
  currency: string;
  onSetNewGoal: () => void;
}) {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const currentPct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const currencyLabel = t(`currency.${currency}`, currency);
  const isComplete = currentPct >= 100;

  return (
    // items-center: the two columns' own content is naturally shorter than
    // the row this card is stretched to by its sibling (Quick Insights) one
    // level up in dashboard.tsx — flex-1 on GoalCard's root that stretch
    // reaches this div, but centering the columns *within* it needs to
    // happen here too, since `justify-center` on each column only centers
    // within ITS OWN intrinsic height, not the taller stretched row.
    <div className="grid flex-1 grid-cols-3 items-center gap-4">
      {/* Bar + header take 2 of 3 columns; the amount-saved panel fills the
          3rd column beside it, and is tall enough to also fill the space
          beneath the (much shorter) bar — no more empty leftover space
          either direction. */}
      <div className="col-span-2 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <Tooltip
            content={t("dashboard.goals.durationTooltip", { count: goal.duration })}
          >
            <span className="text-base-content text-2xl font-bold tracking-tight">
              {currentPct}%
            </span>
          </Tooltip>
          {isComplete ? (
            <Tooltip content={t("dashboard.goals.completedTooltip")}>
              <span className="bg-success/10 text-success inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                <CheckCircle2 data-no-flip className="size-3" />
                {t("dashboard.goals.completed")}
              </span>
            </Tooltip>
          ) : (
            goal.onTrack !== undefined && (
              <Tooltip
                content={t(
                  goal.onTrack
                    ? "dashboard.goals.onTrackTooltip"
                    : "dashboard.goals.behindScheduleTooltip",
                )}
              >
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
              </Tooltip>
            )
          )}
        </div>

        {/* Thicker bar with real milestone checkpoints (not just tick
            marks) — reached ones fill solid with a check, the rest stay
            hollow, same reached/ahead semantics the old four-row timeline
            showed, just compact. Each dot's positioning wrapper is OUTSIDE
            the Tooltip on purpose: Tooltip measures its own wrapper span to
            place the bubble, and that wrapper is `inline-flex` with no
            explicit size — if the thing Tooltip wraps is itself
            `position: absolute`, it's taken out of flow and contributes no
            size, so the wrapper collapses to a zero-size box and the
            tooltip anchors to the wrong spot. Keeping the absolute
            positioning on this outer div and handing Tooltip a normal
            (in-flow, real-sized) dot span keeps the measurement honest. */}
        <div className="relative h-4 w-full">
          <div className="bg-base-200 h-full w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${isComplete ? "bg-success" : "bg-primary"}`}
              style={{ width: `${currentPct}%` }}
            />
          </div>
          {[25, 50, 75].map((pct) => {
            const reached = currentPct >= pct;
            const milestoneAmount = Math.round(goal.target * (pct / 100));
            return (
              // flex (not the default inline-flow of a bare div): Tooltip's
              // own wrapper is `inline-flex`, which as a nested inline-level
              // box can pick up baseline-alignment slop inside a plain div —
              // making it a flex item here forces it to size and center
              // exactly to its content, so reached/unreached dots (one has
              // an icon child, one doesn't) still land on the identical
              // vertical center rather than drifting a px or two apart.
              <div
                key={pct}
                className="absolute top-1/2 flex"
                style={{
                  insetInlineStart: `${pct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Tooltip
                  content={t(
                    reached
                      ? "dashboard.goals.milestoneReachedTooltip"
                      : "dashboard.goals.milestoneTooltip",
                    { pct, amount: formatN(milestoneAmount), currency: currencyLabel },
                  )}
                >
                  {/* size-6 vs. the bar's own h-4: milestones read as
                      distinct checkpoints sitting slightly proud of the
                      bar, not just thicker tick marks. */}
                  <span
                    className={`border-base-100 grid size-6 place-items-center rounded-full border-2 ${
                      reached ? (isComplete ? "bg-success" : "bg-primary") : "bg-base-300"
                    }`}
                  >
                    {reached && (
                      <Check
                        data-no-flip
                        className="text-primary-content size-3.5"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                </Tooltip>
              </div>
            );
          })}
        </div>

        {isComplete ? (
          // Same slot the projected-completion pill occupies below the bar
          // when the goal is still in progress — completing it retires that
          // pill, so this is the natural place to prompt for what's next
          // instead of leaving the space empty.
          <div className="bg-success/10 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl px-3 py-2.5">
            <p className="text-success inline-flex items-center gap-1.5 text-sm font-medium">
              <PartyPopper data-no-flip className="size-4 shrink-0" />
              {t("dashboard.goals.congratsMessage")}
            </p>
            <button
              type="button"
              onClick={onSetNewGoal}
              className="btn btn-success btn-xs"
            >
              {t("dashboard.goals.setNewGoal")}
            </button>
          </div>
        ) : (
          goal.projectedCompletionDate && (
            <div className="bg-base-200/60 text-base-content/60 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
              <Calendar data-no-flip className="size-3" />
              {t("dashboard.goals.projectedCompletion", {
                date: formatDate(goal.projectedCompletionDate, dateFormat),
              })}
            </div>
          )
        )}
      </div>

      <div className="bg-base-200/40 col-span-1 flex flex-col justify-center gap-4 rounded-xl p-4 text-center">
        <div>
          <p className="text-base-content/50 text-xs">{t("dashboard.goals.current")}</p>
          <p className="text-2xl font-bold">
            <Money>{formatN(goal.current)}</Money>
          </p>
          <p className="text-base-content/40 text-xs">
            {t("dashboard.goals.ofTarget", {
              target: formatN(goal.target),
              currency: currencyLabel,
            })}
          </p>
        </div>
        {!isComplete && (
          // w-full: Tooltip's own wrapper is `inline-flex` with no explicit
          // size, so without this the block below shrinks to its content
          // width inside that wrapper instead of filling the panel — which
          // reads as off-center even though `text-center` is still applied.
          <Tooltip content={t("dashboard.goals.remainingTooltip")} className="w-full">
            <div className="border-base-300/60 w-full border-t pt-3">
              <p className="text-base-content/50 text-xs">
                {t("dashboard.goals.remainingLabel")}
              </p>
              <p className="text-base-content text-base font-semibold">
                <Money>{formatN(Math.max(0, goal.target - goal.current))}</Money>{" "}
                {currencyLabel}
              </p>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function GoalCardSkeleton() {
  return (
    <div className="animate-entry flex h-full flex-col gap-4">
      <div className="flex shrink-0 items-center gap-1.5">
        <Target className="text-primary size-4 shrink-0" />
        <div className="bg-base-200 h-4 w-24 animate-pulse rounded" />
      </div>
      <div className="grid flex-1 grid-cols-3 items-center gap-4">
        <div className="col-span-2 flex flex-col justify-center gap-4">
          <div className="bg-base-200 h-7 w-16 animate-pulse rounded" />
          <div className="bg-base-200 h-4 w-full animate-pulse rounded-full" />
          <div className="bg-base-200 h-5 w-32 animate-pulse rounded-full" />
        </div>
        <div className="bg-base-200/40 col-span-1 rounded-xl p-4">
          <div className="bg-base-200 mx-auto h-8 w-20 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

export function GoalCard({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const { data: goals, isPending, isError, refetch } = useGoals();
  const modalRef = useRef<HTMLDialogElement>(null);
  const goal = goals?.[0];
  // Distinguishes the pencil (edit this goal's current name/target/duration)
  // from "Set new savings goal" (start over with a blank form instead of the
  // just-completed numbers) — both open the same modal/dialog element.
  const [startingNewGoal, setStartingNewGoal] = useState(false);

  if (isPending) {
    return <GoalCardSkeleton />;
  }

  return (
    // h-full: lets GoalProgress's own flex-1 actually have extra height to
    // grow into and center within, instead of the card just sitting at its
    // own short content height inside the taller row Quick Insights forces
    // (see GoalProgress's comment).
    <div className="animate-entry flex h-full flex-col gap-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <Target className="text-primary size-4 shrink-0" />
        {/* Just the goal's own name, no "Your goal" prefix — every other
            dashboard card's header is a single title (Budget Plan Split,
            Quick Insights, Recurring Charges, ...), and the Target icon
            already reads as "this is the goal card" on its own. */}
        <h2 className="line-clamp-1 flex-1 text-sm font-semibold">
          {goal && goal.name && goal.name !== "Not provided"
            ? goal.name
            : t("dashboard.goals.titleShort")}
        </h2>
        {goal && (
          <Tooltip content={t("dashboard.goals.editTitle")}>
            <button
              type="button"
              onClick={() => {
                setStartingNewGoal(false);
                modalRef.current?.showModal();
              }}
              className="btn btn-ghost btn-xs btn-square"
              aria-label={t("dashboard.goals.editTitle")}
            >
              <Pencil data-no-flip className="size-3.5" />
            </button>
          </Tooltip>
        )}
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : goal && goal.target ? (
        <GoalProgress
          goal={goal}
          currency={currency}
          onSetNewGoal={() => {
            setStartingNewGoal(true);
            modalRef.current?.showModal();
          }}
        />
      ) : (
        <GoalEmptyState
          onAddClick={() => {
            setStartingNewGoal(false);
            modalRef.current?.showModal();
          }}
        />
      )}
      <GoalsEditModal ref={modalRef} goal={goal} forceEmpty={startingNewGoal} />
    </div>
  );
}
