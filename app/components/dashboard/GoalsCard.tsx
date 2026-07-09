import { useRef } from "react";
import { Target, Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FinancialGoal } from "@/types/goal";
import { useGoals } from "@/queries/goals";
import { GoalsEditModal } from "@/components/dashboard/GoalsEditModal";
import { CardSkeleton, ErrorState } from "@/components/shared/QueryState";
import { Money } from "@/components/shared/Money";

function GoalRow({ goal, currency }: { goal: FinancialGoal; currency: string }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const remaining = Math.max(0, goal.target - goal.current);
  const { t } = useTranslation();
  const currencyLabel = t(`currency.${currency}`, currency);

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{goal.name}</span>
        <Money className="text-base-content/60 tabular-nums">
          {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {currencyLabel}
        </Money>
      </div>
      <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-base-content/50 text-xs">
        <span>{pct}% · </span>
        <Money className="inline">
          {t("dashboard.goals.remaining", {
            amount: remaining.toLocaleString(),
            currency: currencyLabel,
          })}
        </Money>
      </p>
    </li>
  );
}

export function GoalsCard({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const { data: goals, isPending, isError, refetch } = useGoals();
  const modalRef = useRef<HTMLDialogElement>(null);
  const goal = goals?.[0];

  if (isPending) {
    return (
      <CardSkeleton
        icon={Target}
        fullHeight
        rows={[{ kind: "progress", trailingText: true }]}
      />
    );
  }

  return (
    <div className="card border-base-300 bg-base-100 animate-entry h-full border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Target className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">{t("dashboard.goals.title")}</h2>
          {goal && (
            <button
              type="button"
              onClick={() => modalRef.current?.showModal()}
              className="btn btn-ghost btn-sm btn-square"
              aria-label={t("dashboard.goals.editTitle")}
            >
              <Pencil data-no-flip className="size-4" />
            </button>
          )}
        </div>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : goal ? (
          <GoalRow goal={goal} currency={currency} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-base-content/50 text-sm">{t("dashboard.goals.empty")}</p>
            <button
              type="button"
              onClick={() => modalRef.current?.showModal()}
              className="btn btn-primary btn-sm gap-2"
            >
              <Plus className="size-4" />
              {t("dashboard.goals.addYours")}
            </button>
          </div>
        )}
      </div>
      <GoalsEditModal ref={modalRef} goal={goal} />
    </div>
  );
}
