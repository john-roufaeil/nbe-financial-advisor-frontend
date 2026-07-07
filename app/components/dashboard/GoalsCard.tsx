import { useRef } from "react";
import { Target, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FinancialGoal } from "@/lib/demo-financials";
import { useGoalsStore } from "@/store/use-goals-store";
import { GoalsEditModal } from "@/components/dashboard/GoalsEditModal";

function GoalRow({ goal, currency }: { goal: FinancialGoal; currency: string }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const remaining = Math.max(0, goal.target - goal.current);
  const { t } = useTranslation();

  return (
    <li className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{goal.name}</span>
        <span className="text-base-content/60 tabular-nums">
          {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {currency}
        </span>
      </div>
      <div className="bg-base-200 h-2 w-full overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-base-content/50 text-xs">
        {pct}% ·{" "}
        {t("dashboard.goals.remaining", { amount: remaining.toLocaleString(), currency })}
      </p>
    </li>
  );
}

export function GoalsCard({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const goals = useGoalsStore((s) => s.goals);
  const modalRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="card border-base-300 bg-base-100 border shadow-sm">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Target className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">{t("dashboard.goals.title")}</h2>
          <button
            type="button"
            onClick={() => modalRef.current?.showModal()}
            className="btn btn-ghost btn-sm btn-square"
            aria-label={t("dashboard.goals.editTitle")}
          >
            <Pencil className="size-4" />
          </button>
        </div>
        {goals.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {goals.map((goal) => (
              <GoalRow key={goal.id} goal={goal} currency={currency} />
            ))}
          </ul>
        ) : (
          <p className="text-base-content/50 text-sm">{t("dashboard.goals.empty")}</p>
        )}
      </div>
      <GoalsEditModal ref={modalRef} />
    </div>
  );
}
