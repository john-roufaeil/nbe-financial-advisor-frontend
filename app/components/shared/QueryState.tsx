import { TriangleAlert, Target, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ErrorState({
  message,
  onRetry,
  className = "",
}: {
  message?: string;
  onRetry: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`border-error/20 bg-error/5 flex size-full flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center ${className}`}
    >
      <div className="flex flex-col items-center gap-3">
        <span className="bg-error/10 text-error grid size-11 place-items-center rounded-full">
          <TriangleAlert className="size-5" />
        </span>
        <p className="text-base-content/70 w-4/5 text-sm text-balance">
          {message ?? t("common.loadError")}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-error btn-outline btn-sm"
        >
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}

export function EmptyState({
  label,
  icon: Icon,
  className = "",
}: {
  label?: string;
  icon?: typeof TriangleAlert;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto border-base-300 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center ${className}`}
    >
      {Icon && (
        <span className="bg-base-200 text-base-content/40 grid size-11 place-items-center rounded-full">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-base-content/50 w-full text-sm text-balance sm:w-1/2">
        {label ?? t("common.noResults")}
      </p>
    </div>
  );
}

export function GoalEmptyState({ onAddClick }: { onAddClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="border-base-300 bg-base-200/20 flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-4 py-8 text-center">
      <span className="bg-primary/10 text-primary/70 grid size-12 place-items-center rounded-full">
        <Target className="size-5.5" />
      </span>

      <div className="flex max-w-60 flex-col gap-1">
        <h3 className="text-base-content text-sm font-semibold">
          {t("dashboard.goals.emptyTitle", "No active goal")}
        </h3>
        <p className="text-base-content/50 text-xs">
          {t(
            "dashboard.goals.empty",
            "Set a financial target to track your progress milestones.",
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onAddClick}
        className="btn btn-primary btn-sm gap-2 font-medium normal-case shadow-sm"
      >
        <Plus className="size-4" />
        {t("dashboard.goals.addYours", "Create Goal")}
      </button>
    </div>
  );
}
